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
  Slider,
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
import "./CoursesSection.css"; // Import CoursesSection styles

const percentOk = (v) =>
  !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100;

/**
 * Get current semester and year dynamically
 * Spring: January - April
 * Summer: May - July
 * Fall: August - December
 */
const getCurrentSemester = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  if (month >= 0 && month <= 3) {
    // January - April
    return { semester: "Spring", year };
  } else if (month >= 4 && month <= 6) {
    // May - July
    return { semester: "Summer", year };
  } else {
    // August - December
    return { semester: "Fall", year };
  }
};

/**
 * Get color class for course card based on index
 * Cycles through 10 different colors for visual variety
 */
const getCardColorClass = (index) => {
  const colors = [
    "card-blue",
    "card-green",
    "card-purple",
    "card-orange",
    "card-pink",
    "card-teal",
    "card-indigo",
    "card-cyan",
    "card-amber",
  ];
  return colors[index % colors.length];
};

export default function CoursesSection({ onError, resourcesSection }) {
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

  // Edit dialog (name only)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState("");

  // Course details dialog
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [linkedChats, setLinkedChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [detailsPercent, setDetailsPercent] = useState(0);

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
      reportError("Failed to fetch courses");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Edit (name only)
  const openEdit = (course) => {
    setEditing(course);
    setEditName(course.name || "");
    setEditNameError("");
    setIsEditOpen(true);
  };
  const closeEdit = () => {
    setIsEditOpen(false);
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) {
      setEditNameError("Course name is required");
      return;
    }

    const updated = { ...editing, name: editName.trim() };
    setCourses((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
    closeEdit();

    try {
      await updateCourse(updated._id, {
        name: updated.name,
        percent: updated.percent,
      });
    } catch (e) {
      reportError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to update course"
      );
      refresh();
    }
  };

  // ---- Add
  const fetchExistingChats = async () => {
    try {
      const response = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setExistingChats(data.conversations.filter((chat) => !chat.courseId));
    } catch (error) {
      reportError("Failed to fetch existing chats");
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
      const courseResponse = await createCourse({
        name: optimistic.name,
        percent: optimistic.percent,
      });
      if (!courseResponse?.course?._id) {
        throw new Error("Invalid course response from server");
      }
      const courseId = courseResponse.course._id;

      // If createNewChat is true, create a new chat for this course
      if (createNewChat) {
        const chatDetails = {
          title: `${optimistic.name} - New Chat`,
          courseId: courseId,
          courseName: optimistic.name,
        };

        const chatResponse = await fetch(`${API_BASE}/chat/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(chatDetails),
        });

        if (!chatResponse.ok) {
          const errorData = await chatResponse.json();
          throw new Error(errorData.message || "Failed to create chat");
        }

        await chatResponse.json();
      }

      // Associate selected existing chats with the course
      if (selectedChats.length > 0) {
        await Promise.all(
          selectedChats.map(async (chatId) => {
            const response = await fetch(
              `${API_BASE}/chat/conversations/${chatId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                  title: `${optimistic.name} - Existing Chat`, // optional: update title
                  courseId: courseId,
                  courseName: optimistic.name,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to associate chat");
            }
            await response.json();
          })
        );
      }

      await refresh();
    } catch (e) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e.message ||
        "Failed to save course";
      reportError(errorMessage);
      setCourses((prev) => prev.filter((c) => c._id !== optimistic._id));
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      // Filter conversations that belong to this course
      const matchingChats = data.conversations.filter((chat) => {
        // Convert both IDs to strings for comparison
        const chatCourseIdStr = (chat.courseId || "").toString();
        const targetCourseIdStr = (courseId || "").toString();
        const matches = chatCourseIdStr === targetCourseIdStr;

        return matches;
      });

      setLinkedChats(matchingChats);
    } catch (error) {
      reportError("Failed to load course chats");
    } finally {
      setLoadingChats(false);
    }
  };

  const handleQuickProgressUpdate = async () => {
    if (!selectedCourse?._id) return;
    const nextPercent = Math.min(100, Math.max(0, Math.round(detailsPercent)));
    try {
      await updateCourse(selectedCourse._id, {
        name: selectedCourse.name,
        percent: nextPercent,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c._id === selectedCourse._id ? { ...c, percent: nextPercent } : c
        )
      );
      setSelectedCourse((prev) =>
        prev ? { ...prev, percent: nextPercent } : prev
      );
    } catch {
      reportError("Failed to update course progress");
    }
  };

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    setIsDetailsOpen(true);
    setDetailsPercent(Number.isFinite(course?.percent) ? course.percent : 0);
    fetchLinkedChats(course._id);
  };

  const closeCourseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCourse(null);
    setLinkedChats([]);
    setDetailsPercent(0);
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
        <Alert severity="error" sx={{ mb: 2, maxWidth: 1000, mx: "auto" }}>
          {localError}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 3,
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <h2>Courses</h2>
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={openAdd}
            >
              Add Course
            </Button>
          </Box>

          <div className="courses-list">
        {courses.map((course, idx) => (
          <div
            className={`course-card ${getCardColorClass(idx)}`}
            key={course._id || `${course.name}-${idx}`}
            onClick={() => openCourseDetails(course)}
            style={{ cursor: "pointer" }}
          >
            {/* Color Banner */}
            <div className="course-card-banner" />

            {/* Card Content */}
            <div className="course-card-content">
              <h3 className="course-card-title">{course.name}</h3>

              {/* Meta Information */}
              <div className="course-card-meta">
                <span className="course-meta-badge">
                  📅 {getCurrentSemester().semester} {getCurrentSemester().year}
                </span>
              </div>

              {/* Progress Section */}
              <div className="course-progress-section">
                <div className="course-progress-label">
                  <span>Progress</span>
                  <span className="course-progress-value">{course.percent}%</span>
                </div>
                <div className="course-progress">
                  <div 
                    className="course-progress-bar" 
                    style={{ width: `${course.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer with Icons */}
            <div className="course-card-footer" onClick={(e) => e.stopPropagation()}>
              <div style={{ flex: 1, minWidth: 0 }} />
              <div className="course-actions">
                <Tooltip title="Details">
                  <IconButton
                    size="small"
                    onClick={() => openCourseDetails(course)}
                    aria-label={`Details ${course.name}`}
                  >
                    <ChatIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit name">
                  <IconButton
                    size="small"
                    onClick={() => openEdit(course)}
                    aria-label={`Edit ${course.name}`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => openDelete(course)}
                    aria-label={`Delete ${course.name}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="no-chat-history" style={{ marginTop: 12, gridColumn: "1 / -1" }}>
            <p>No courses yet. Click "Add Course" to create one.</p>
          </div>
        )}
          </div>
        </Box>
        
        {/* Resources Section on the right */}
        {resourcesSection}
      </Box>

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
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Chat Options
            </Typography>

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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Or Select Existing Chats:
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                  {existingChats.map((chat) => (
                    <Box
                      key={chat.id}
                      sx={{
                        p: 1,
                        mb: 0.5,
                        border: 1,
                        borderColor: selectedChats.includes(chat.id)
                          ? "primary.main"
                          : "grey.300",
                        borderRadius: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                        bgcolor: selectedChats.includes(chat.id)
                          ? "action.selected"
                          : "background.paper",
                      }}
                      onClick={() => {
                        setSelectedChats((prev) =>
                          prev.includes(chat.id)
                            ? prev.filter((id) => id !== chat.id)
                            : [...prev, chat.id]
                        );
                      }}
                    >
                      <Typography noWrap>
                        {chat.title || "Untitled Chat"}
                      </Typography>
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

      {/* Edit Course Name */}
      <Dialog open={isEditOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit course name</DialogTitle>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Course */}
      <Dialog open={isDeleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete course?</DialogTitle>
        <DialogContent>
          <Typography>
            {`Are you sure you want to delete "${
              toDelete?.name || ""
            }"? This can't be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Details */}
      <Dialog
        open={isDetailsOpen}
        onClose={closeCourseDetails}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">{selectedCourse?.name}</Typography>
            <Typography variant="subtitle1" color="primary">
              {Math.round(detailsPercent)}%
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Set course progress
            </Typography>
            <Slider
              value={detailsPercent}
              onChange={(_, val) => setDetailsPercent(val)}
              aria-label="Course progress"
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {Math.round(detailsPercent)}% complete
              </Typography>
              <Button variant="contained" size="small" onClick={handleQuickProgressUpdate}>
                Save progress
              </Button>
            </Box>
          </Box>

          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <ChatIcon /> Course Chats
          </Typography>

          {loadingChats ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : linkedChats.length > 0 ? (
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              {linkedChats.map((chat) => (
                <Box
                  key={chat.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: "grey.300",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography sx={{ flex: 1 }}>
                    {chat.title || "Untitled Chat"}
                  </Typography>
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
            <Box sx={{ textAlign: "center", p: 3, color: "text.secondary" }}>
              <Typography sx={{ mb: 2 }}>
                No chats linked to this course yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => {
                  closeCourseDetails();
                  navigate("/chat");
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
