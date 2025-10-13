
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import axios from "axios";
import "./Dashboard.css";

const API_BASE =
  (import.meta && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL)) ||
  "http://localhost:3000";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  // Courses from backend (replaces hardcoded defaults)
  const [courses, setCourses] = useState([]);

  // Add-course dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCoursePercent, setNewCoursePercent] = useState("");

  const [nameError, setNameError] = useState("");
  const [percentError, setPercentError] = useState("");

  const navigate = useNavigate();

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ------- Fetch all courses (source of truth) -------
  const fetchCourses = async () => {
    try {
      const coursesRes = await axios.get(`${API_BASE}/courses`, {
        headers: authHeaders(),
        timeout: 8000,
      });

      // Support both API shapes: array or { courses: [...] }
      const raw = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];

      const list = raw.map((c) => ({
        _id: c._id,
        name: c.name,
        percent:
          typeof c.percent === "number" ? c.percent : Number(c.percent) || 0,
      }));

      setCourses(list);
    } catch (courseErr) {
      console.error("Failed to fetch courses:", courseErr);
      setError("Failed to fetch courses");
    }
  };

  // Fetch user profile, chat history, and courses
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your dashboard");
          setLoading(false);
          return;
        }

        // User profile
        const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
          headers: authHeaders(),
          timeout: 8000,
        });
        setUser(profileResponse.data);

        // Chat conversations (best-effort)
        try {
          const chatResponse = await axios.get(
            `${API_BASE}/chat/conversations`,
            { headers: authHeaders(), timeout: 8000 }
          );
          setChatHistory((chatResponse.data?.conversations || []).slice(0, 5));
        } catch {
          setChatHistory([]);
        }

        // Courses for this user (always sync from server)
        await fetchCourses();

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch user data");
        setLoading(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dialog open/close
  const openAddDialog = () => {
    setNewCourseName("");
    setNewCoursePercent("");
    setNameError("");
    setPercentError("");
    setIsAddOpen(true);
  };
  const closeAddDialog = () => setIsAddOpen(false);

  // Add course (validates + persists)
  const handleAddCourse = async () => {
    let valid = true;

    if (!newCourseName.trim()) {
      setNameError("Course name is required");
      valid = false;
    } else {
      setNameError("");
    }

    const pct = Number(newCoursePercent);
    if (Number.isNaN(pct)) {
      setPercentError("Enter a number");
      valid = false;
    } else if (pct < 0 || pct > 100) {
      setPercentError("Percent must be between 0 and 100");
      valid = false;
    } else {
      setPercentError("");
    }

    if (!valid) return;

    const optimistic = {
      _id: `tmp_${Date.now()}`,
      name: newCourseName.trim(),
      percent: Math.round(pct),
    };

    // Optimistic UI update (append; do NOT replace existing items)
    setCourses((prev) => [...prev, optimistic]);
    closeAddDialog();

    try {
      const payload = {
        name: optimistic.name,
        percent: optimistic.percent,
      };

      await axios.post(`${API_BASE}/courses`, payload, {
        headers: authHeaders(),
        timeout: 8000,
      });

      // After a successful save, always re-fetch the full list
      await fetchCourses();
      setError(null);
    } catch (e) {
      console.error("Failed to save course:", e);
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to save course"
      );
      // Revert optimistic add
      setCourses((prev) => prev.filter((c) => c._id !== optimistic._id));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !user) {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: "auto" }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/login")}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <div className="dashboard-container" style={{ margin: "40px 0 0 0" }}>
      {/* Page-level error (non-blocking) */}
      {error && user && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 1000, margin: "0 auto" }}>
          {error}
        </Alert>
      )}

      <div className="dashboard-left-column">
        <div className="dashboard-profile">
          <h2 style={{ fontWeight: "bold", fontSize: "1.8rem" }}>
            Student Details
          </h2>
          <div className="profile-field">
            <span className="profile-label">First Name:</span>{" "}
            <span className="profile-value">{user?.firstname || "N/A"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Last Name:</span>{" "}
            <span className="profile-value">{user?.lastname || "N/A"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Username:</span>{" "}
            <span className="profile-value">{user?.username || "N/A"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Grade Level:</span>{" "}
            <span className="profile-value">{user?.gradeLevel || "N/A"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Region:</span>{" "}
            <span className="profile-value">{user?.region || "N/A"}</span>
          </div>
          <Button
            variant="contained"
            sx={{ mt: 2, width: "100%" }}
            onClick={() => navigate("/profile")}
          >
            View Profile
          </Button>
        </div>

        <div className="dashboard-chat-history">
          <h2>Recent Chat History</h2>
          <Button
            variant="contained"
            sx={{ mb: 2, width: "100%" }}
            onClick={() => navigate("/chat")}
          >
            New Chat
          </Button>
          {chatHistory.length > 0 ? (
            <div className="chat-history-list">
              {chatHistory.map((conversation, idx) => (
                <div
                  className="chat-history-item"
                  key={conversation.id || idx}
                  onClick={() =>
                    navigate(`/chat?conversationId=${conversation.id}`)
                  }
                >
                  <div className="chat-preview">
                    {conversation.title || "Untitled Conversation"}
                  </div>
                  <div className="chat-date">
                    {(() => {
                      const d = new Date(
                        conversation.updatedAt || conversation.createdAt
                      );
                      return isNaN(d) ? "" : d.toLocaleDateString();
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-chat-history">
              <p>
                No chat history available. Start a conversation with the
                ChatBot!
              </p>
              <Button
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={() => navigate("/chat")}
              >
                Start Chatting
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-courses">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2>Courses & Test Scores</h2>
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={openAddDialog}
          >
            Add Course
          </Button>
        </div>

        <div className="courses-list">
          {courses.map((course, idx) => (
            <div className="course-card" key={course._id || `${course.name}-${idx}`}>
              <div className="course-title">{course.name}</div>
              <div className="course-percent">{course.percent}%</div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="no-chat-history" style={{ marginTop: 12 }}>
              <p>No courses yet. Click “Add Course” to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Course dialog */}
      <Dialog open={isAddOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add a new course</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Course name"
            fullWidth
            margin="normal"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            error={!!nameError}
            helperText={nameError || "e.g., Operating Systems"}
          />
          <TextField
            label="Percent"
            type="number"
            fullWidth
            margin="normal"
            value={newCoursePercent}
            onChange={(e) => setNewCoursePercent(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            error={!!percentError}
            helperText={percentError || "0–100"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCourse}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Dashboard;
