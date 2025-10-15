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
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const [courses, setCourses] = useState([]);
  const [localError, setLocalError] = useState("");

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPercent, setNewPercent] = useState("");
  const [nameError, setNameError] = useState("");
  const [percentError, setPercentError] = useState("");

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPercent, setEditPercent] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [editPercentError, setEditPercentError] = useState("");

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
  const openAdd = () => {
    setNewName("");
    setNewPercent("");
    setNameError("");
    setPercentError("");
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
      await createCourse({ name: optimistic.name, percent: optimistic.percent });
      await refresh();
    } catch (e) {
      console.error("create course failed:", e);
      reportError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to save course"
      );
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
          <div className="course-card" key={course._id || `${course.name}-${idx}`}>
            <div className="course-card-top">
              <div className="course-title" title={course.name}>
                {course.name}
              </div>
              <Stack direction="row" spacing={0.5} className="course-actions">
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
            <p>No courses yet. Click “Add Course” to create one.</p>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAdd}>Cancel</Button>
          <Button variant="contained" onClick={saveAdd}>Save</Button>
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
            {`Are you sure you want to delete “${toDelete?.name || ""}”? This can’t be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
