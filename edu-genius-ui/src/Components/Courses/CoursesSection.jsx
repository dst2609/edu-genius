import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  Tooltip,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api/client";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatIcon from "@mui/icons-material/Chat";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../api/courses";
import "../Dashboard/Dashboard.css"; // reuse same stylesheet

const percentOk = (v) =>
  !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100;

export default function CoursesSection({ onError }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [localError, setLocalError] = useState("");

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPercent, setNewPercent] = useState("");
  const [nameError, setNameError] = useState("");
  const [percentError, setPercentError] = useState("");
  const [existingChats, setExistingChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [createNewChat, setCreateNewChat] = useState(false);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPercent, setEditPercent] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [editPercentError, setEditPercentError] = useState("");

  // Course details dialog
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [linkedChats, setLinkedChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const reportError = (msg) => {
    setLocalError(msg);
    onError?.(msg);
  };
  const clearError = () => {
    setLocalError("");
    onError?.(null);
  };

  const refresh = async () => {
    try {
      const data = await listCourses();
      setCourses(data);
      clearError();
    } catch (e) {
      console.error("fetch courses failed:", e);
      reportError("Failed to fetch courses");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Add
  const fetchExistingChats = async () => {
    try {
      const response = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setExistingChats(data.conversations.filter(chat => !chat.courseId));
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      reportError('Failed to fetch existing chats');
    }
  };

  const openAdd = () => {
    setNewName("");
    setNewPercent("");
    setNameError("");
    setPercentError("");
    setSelectedChats([]);
    setCreateNewChat(false);
    fetchExistingChats();
    setIsAddOpen(true);
  };
  const closeAdd = () => setIsAddOpen(false);

  const saveAdd = async () => {
    let ok = true;
    if (!newName.trim()) {
      setNameError("Course name is required");
      ok = false;
    } else setNameError("");

    if (!percentOk(newPercent)) {
      setPercentError("Percent must be a number 0–100");
      ok = false;
    } else setPercentError("");

    if (!ok) return;

    const pct = Math.round(Number(newPercent));
    const optimistic = {
      _id: `tmp_${Date.now()}`,
      name: newName.trim(),
      percent: pct,
    };
    setCourses((prev) => [...prev, optimistic]);
    closeAdd();

    try {
      // Create the course
      const courseResponse = await createCourse({ name: optimistic.name, percent: optimistic.percent });
      if (!courseResponse?.course?._id) {
        throw new Error('Invalid course response from server');
      }
      const courseId = courseResponse.course._id;

      // If createNewChat is true, create a new chat for this course
      if (createNewChat) {
        const chatDetails = {
          title: `${optimistic.name} - New Chat`,
          courseId: courseId,
          courseName: optimistic.name,
        };
        console.log('Creating new chat with details:', chatDetails);
        
        const chatResponse = await fetch(`${API_BASE}/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(chatDetails),
        });
        
        if (!chatResponse.ok) {
          const errorData = await chatResponse.json();
          console.error('Failed to create chat:', errorData);
          throw new Error(errorData.message || 'Failed to create chat');
        }

        // Log the response for debugging
        const chatData = await chatResponse.json();
        console.log('New chat created successfully:', chatData);
      }

      // Associate selected existing chats with the course
      if (selectedChats.length > 0) {
        console.log('Linking existing chats:', { selectedChats, courseId, courseName: optimistic.name });
        await Promise.all(selectedChats.map(async chatId => {
          console.log(`Updating chat ${chatId} with course ${courseId}`);
          const response = await fetch(`${API_BASE}/chat/conversations/${chatId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              title: `${optimistic.name} - Existing Chat`,  // optional: update title
              courseId: courseId,
              courseName: optimistic.name
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to associate chat');
          }

          // Log the response for debugging
          const updateData = await response.json();
          console.log(`Chat ${chatId} updated:`, updateData);
        }));
      }

      await refresh();
    } catch (e) {
      console.error("create course failed:", e);
      const errorMessage = e?.response?.data?.message || 
                         e?.response?.data?.error || 
                         e.message || 
                         "Failed to save course";
      reportError(errorMessage);
      setCourses((prev) => prev.filter((c) => c._id !== optimistic._id));
    }
  };

  // ---- Edit
  const openEdit = (course) => {
    setEditing(course);
    setEditName(course.name || "");
    setEditPercent(String(course.percent ?? ""));
    setEditNameError("");
    setEditPercentError("");
    setIsEditOpen(true);
  };
  const closeEdit = () => {
    setIsEditOpen(false);
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing) return;

    let ok = true;
    if (!editName.trim()) {
      setEditNameError("Course name is required");
      ok = false;
    } else setEditNameError("");

    if (!percentOk(editPercent)) {
      setEditPercentError("Percent must be a number 0–100");
      ok = false;
    } else setEditPercentError("");

    if (!ok) return;

    if (!editing._id || String(editing._id).startsWith("tmp_")) {
      reportError("Please wait until the course is saved before editing it.");
      return;
    }

    const updated = {
      ...editing,
      name: editName.trim(),
      percent: Math.round(Number(editPercent)),
    };

    setCourses((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    closeEdit();

    try {
      await updateCourse(updated._id, {
        name: updated.name,
        percent: updated.percent,
      });
      await refresh();
    } catch (e) {
      console.error("update course failed:", e);
      reportError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to update course"
      );
      await refresh();
    }
  };

  // ---- Delete
  const openDelete = (course) => {
    setToDelete(course);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => {
    setToDelete(null);
    setIsDeleteOpen(false);
  };

  const fetchLinkedChats = async (courseId) => {
    setLoadingChats(true);
    try {
      const response = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await response.json();
      
      // Debug information
      console.log('All chats:', data.conversations.map(chat => ({
        id: chat.id,
        courseId: chat.courseId,
        title: chat.title,
        courseName: chat.courseName
      })));
      
      console.log('Looking for chats with courseId:', courseId);

      // Debug the incoming chat data
      console.log('Raw chat data:', JSON.stringify(data.conversations, null, 2));

      // Filter conversations that belong to this course
      const matchingChats = data.conversations.filter(chat => {
        // Detailed debug of each chat object
        console.log('Examining chat:', {
          chatId: chat.id,
          chatTitle: chat.title,
          rawCourseId: chat.courseId,
          targetCourseId: courseId,
          chatData: chat
        });

        // Convert both IDs to strings for comparison
        const chatCourseIdStr = (chat.courseId || '').toString();
        const targetCourseIdStr = (courseId || '').toString();
        const matches = chatCourseIdStr === targetCourseIdStr;
        
        console.log('Comparison result:', {
          chatCourseIdStr,
          targetCourseIdStr,
          matches,
          chatTitle: chat.title
        });
        
        return matches;
      });

      console.log('Matched chats:', {
        count: matchingChats.length,
        chats: matchingChats.map(chat => ({
          id: chat.id,
          title: chat.title,
          courseId: chat.courseId
        }))
      });
      
      setLinkedChats(matchingChats);
    } catch (error) {
      console.error('Failed to fetch linked chats:', error);
      reportError('Failed to load course chats');
    } finally {
      setLoadingChats(false);
    }
  };

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    setIsDetailsOpen(true);
    fetchLinkedChats(course._id);
  };

  const closeCourseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCourse(null);
    setLinkedChats([]);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;

    if (!toDelete._id || String(toDelete._id).startsWith("tmp_")) {
      setCourses((prev) => prev.filter((c) => c._id !== toDelete._id));
      closeDelete();
      return;
    }

    const removedId = toDelete._id;
    const snapshot = courses;
    setCourses((prev) => prev.filter((c) => c._id !== removedId));
    closeDelete();

    try {
      await deleteCourse(removedId);
      await refresh();
    } catch (e) {
      console.error("delete course failed:", e);
      reportError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to delete course"
      );
      setCourses(snapshot);
    }
  };

  return (
    <Box className="dashboard-courses">
      {localError && (
        <Alert
          severity="error"
          sx={{ mb: 2, maxWidth: 1000, mx: "auto" }}
        >
          {localError}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Courses</h2>
        <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={openAdd}>
          Add Course
        </Button>
      </Box>

      <div className="courses-list">
        {courses.map((course, idx) => (
          <div 
            className="course-card" 
            key={course._id || `${course.name}-${idx}`}
            onClick={() => openCourseDetails(course)}
            style={{ cursor: 'pointer' }}
          >
            <div className="course-card-top">
              <div className="course-title" title={course.name}>
                {course.name}
              </div>
              <Stack 
                direction="row" 
                spacing={0.5} 
                className="course-actions"
                onClick={(e) => e.stopPropagation()} // Prevent card click when clicking actions
              >
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => openEdit(course)} aria-label={`Edit ${course.name}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => openDelete(course)} aria-label={`Delete ${course.name}`}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </div>
            <div className="course-percent">{course.percent}%</div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="no-chat-history" style={{ marginTop: 12 }}>
            <p>No courses yet. Click "Add Course" to create one.</p>
          </div>
        )}
      </div>

      {/* Add Course */}
      <Dialog open={isAddOpen} onClose={closeAdd} fullWidth maxWidth="sm">
        <DialogTitle>Add a new course</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Course name"
            fullWidth
            margin="normal"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={!!nameError}
            helperText={nameError || "e.g., Operating Systems"}
          />
          <TextField
            label="Percent"
            type="number"
            fullWidth
            margin="normal"
            value={newPercent}
            onChange={(e) => setNewPercent(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            error={!!percentError}
            helperText={percentError || "0–100"}
          />
          
          {/* Chat Options */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Chat Options</Typography>
            
            {/* Create New Chat Option */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant={createNewChat ? "contained" : "outlined"}
                onClick={() => setCreateNewChat(!createNewChat)}
                startIcon={<AddCircleOutlineIcon />}
                sx={{ mb: 1 }}
              >
                {createNewChat ? "New Chat Will Be Created" : "Create New Chat"}
              </Button>
            </Box>

            {/* Existing Chats */}
            {existingChats.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Or Select Existing Chats:</Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {existingChats.map((chat) => (
                    <Box
                      key={chat.id}
                      sx={{
                        p: 1,
                        mb: 0.5,
                        border: 1,
                        borderColor: selectedChats.includes(chat.id) ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedChats.includes(chat.id) ? 'action.selected' : 'background.paper',
                      }}
                      onClick={() => {
                        setSelectedChats(prev =>
                          prev.includes(chat.id)
                            ? prev.filter(id => id !== chat.id)
                            : [...prev, chat.id]
                        );
                      }}
                    >
                      <Typography noWrap>{chat.title || 'Untitled Chat'}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAdd}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveAdd}
            disabled={!createNewChat && selectedChats.length === 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course */}
      <Dialog open={isEditOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit course</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Course name"
            fullWidth
            margin="normal"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            error={!!editNameError}
            helperText={editNameError || "Update the course name"}
          />
          <TextField
            label="Percent"
            type="number"
            fullWidth
            margin="normal"
            value={editPercent}
            onChange={(e) => setEditPercent(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            error={!!editPercentError}
            helperText={editPercentError || "0–100"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Course */}
      <Dialog open={isDeleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete course?</DialogTitle>
        <DialogContent>
          <Typography>
            {`Are you sure you want to delete "${toDelete?.name || ""}"? This can't be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Course Details */}
      <Dialog open={isDetailsOpen} onClose={closeCourseDetails} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{selectedCourse?.name}</Typography>
            <Typography variant="subtitle1" color="primary">{selectedCourse?.percent}%</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon /> Course Chats
          </Typography>

          {loadingChats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : linkedChats.length > 0 ? (
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {linkedChats.map((chat) => (
                <Box
                  key={chat.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ flex: 1 }}>{chat.title || 'Untitled Chat'}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => {
                      closeCourseDetails();
                      navigate(`/chat?conversationId=${chat.id}`);
                    }}
                  >
                    Open
                  </Button>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              <Typography sx={{ mb: 2 }}>No chats linked to this course yet.</Typography>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => {
                  closeCourseDetails();
                  navigate('/chat');
                }}
              >
                Start New Chat
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCourseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}