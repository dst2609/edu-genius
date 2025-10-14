import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import axios from "axios";
import "../Dashboard/Dashboard.css"; 
import CoursesSection from "../Courses/CoursesSection.jsx";
import { API_BASE, authHeaders } from "../../api/client";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [user, setUser]     = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your dashboard");
          setLoading(false);
          return;
        }
        const profileRes = await axios.get(`${API_BASE}/users/profile`, {
          headers: authHeaders(),
          timeout: 8000,
        });
        setUser(profileRes.data);
        try {
          const chatRes = await axios.get(`${API_BASE}/chat/conversations`, {
            headers: authHeaders(),
            timeout: 8000,
          });
          setChatHistory((chatRes.data?.conversations || []).slice(0, 5));
        } catch {
          setChatHistory([]);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch user data");
        setLoading(false);
      }
    })();
  }, []);

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
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <div className="dashboard-container" style={{ margin: "40px 0 0 0" }}>
      {/* page-level error (non-blocking) */}
      {error && user && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 1000, margin: "0 auto" }}>
          {error}
        </Alert>
      )}
      <div className="dashboard-left-column">
        {/* Profile */}
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
          <Button variant="contained" sx={{ mt: 2, width: "100%" }} onClick={() => navigate("/profile")}>
            View Profile
          </Button>
        </div>

        {/* Recent Chat History */}
        <div className="dashboard-chat-history">
          <h2>Recent Chat History</h2>
          <Button variant="contained" sx={{ mb: 2, width: "100%" }} onClick={() => navigate("/chat")}>
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
                  <div className="chat-preview">{conversation.title || "Untitled Conversation"}</div>
                  <div className="chat-date">
                    {(() => {
                      const d = new Date(conversation.updatedAt || conversation.createdAt);
                      return isNaN(d) ? "" : d.toLocaleDateString();
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-chat-history">
              <p>No chat history available. Start a conversation with the ChatBot!</p>
              <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate("/chat")}>
                Start Chatting
              </Button>
            </div>
          )}
        </div>
      </div>
      <CoursesSection onError={setError} />
    </div>
  );
};

export default Dashboard;
