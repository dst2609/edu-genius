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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  // NEW: courses are now in state so we can add to them
  const [courses, setCourses] = useState([
    { name: "DSA (CMPE 126)", percent: 86 },
    { name: "Mathematical Engineering", percent: 93 },
    { name: "Computer Architecture", percent: 81 },
  ]);

  // NEW: dialog/form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCoursePercent, setNewCoursePercent] = useState("");

  const [nameError, setNameError] = useState("");
  const [percentError, setPercentError] = useState("");

  const navigate = useNavigate();

  // Fetch user profile and chat history
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your dashboard");
          setLoading(false);
          return;
        }

        // Fetch user profile
        const profileResponse = await axios.get("http://localhost:3000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileResponse.data);

        // Fetch chat conversations
        try {
          const chatResponse = await axios.get("http://localhost:3000/chat/conversations", {
            headers: { Authorization: `Bearer ${token}` },
          });
        setChatHistory(chatResponse.data.conversations.slice(0, 5));
        } catch (chatErr) {
          console.log("No chat history available or error fetching conversations");
          setChatHistory([]);
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch user data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // NEW: open/close dialog
  const openAddDialog = () => {
    setNewCourseName("");
    setNewCoursePercent("");
    setNameError("");
    setPercentError("");
    setIsAddOpen(true);
  };
  const closeAddDialog = () => setIsAddOpen(false);

  // NEW: validate and add course
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

    const course = { name: newCourseName.trim(), percent: pct };

    // Instant UI update
    setCourses((prev) => [...prev, course]);
    closeAddDialog();

    // OPTIONAL: persist to backend if you have an endpoint
    // try {
    //   const token = localStorage.getItem("token");
    //   await axios.post("http://localhost:3000/courses", course, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   });
    // } catch (e) {
    //   console.error("Failed to save course:", e);
    //   // Optionally show a toast/snackbar or revert optimistic update
    // }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
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
      <div className="dashboard-left-column">
        <div className="dashboard-profile">
          <h2 style={{ fontWeight: "bold", fontSize: "1.8rem" }}>Student Details</h2>
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
                  onClick={() => navigate(`/chat?conversationId=${conversation.id}`)}
                >
                  <div className="chat-preview">
                    {conversation.title || "Untitled Conversation"}
                  </div>
                  <div className="chat-date">
                    {new Date(conversation.updatedAt || conversation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-chat-history">
              <p>No chat history available. Start a conversation with the ChatBot!</p>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2>Courses & Test Scores</h2>
          {/* NEW: Add Course button */}
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
            <div className="course-card" key={`${course.name}-${idx}`}>
              <div className="course-title">{course.name}</div>
              <div className="course-percent">{course.percent}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Add Course dialog */}
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
          <Button variant="contained" onClick={handleAddCourse}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Dashboard;
