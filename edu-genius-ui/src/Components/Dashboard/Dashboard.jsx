import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import axios from "axios";
import "../Dashboard/Dashboard.css";
import CoursesSection from "../Courses/CoursesSection.jsx";
import { API_BASE, authHeaders } from "../../api/client";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userRole, setUserRole] = useState(null);
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

        // Get user role from localStorage
        const role = localStorage.getItem("role") || "student";
        setUserRole(role);

        // Profile
        const profileRes = await axios.get(`${API_BASE}/users/profile`, {
          headers: authHeaders(),
          timeout: 8000,
        });
        setUser(profileRes.data);

        // Conversations → sort by updatedAt desc → take top 3
        try {
          const chatRes = await axios.get(`${API_BASE}/chat/conversations`, {
            headers: authHeaders(),
            timeout: 8000,
          });

          const all = Array.isArray(chatRes.data?.conversations)
            ? chatRes.data.conversations
            : [];

          const recent = all
            .slice()
            .sort(
              (a, b) =>
                new Date(b.updatedAt || b.createdAt || 0) -
                new Date(a.updatedAt || a.createdAt || 0)
            )
            .slice(0, 3); // ← change to 2 if you only want two

          setChatHistory(recent);
        } catch {
          setChatHistory([]);
        }

        setLoading(false);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setError("Your session expired. Please log in again.");
        } else {
          setError("Failed to fetch user data. Please try again.");
        }
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
      {/* page-level error (non-blocking) */}
      {error && user && (
        <Alert
          severity="error"
          sx={{ mb: 2, maxWidth: 1000, margin: "0 auto" }}
        >
          {error}
        </Alert>
      )}

      <div className="dashboard-left-column">
        {/* Profile */}
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

        {/* Recent Chat History */}
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
                  <div
                    className="chat-preview"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span className="truncate">
                      {conversation.title || "Untitled Conversation"}
                    </span>
                    {conversation.courseName && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          background: "rgba(99,102,241,0.08)", // indigo-50-ish
                          color: "#3730a3", // indigo-700
                          border: "1px solid rgba(99,102,241,0.35)", // indigo-200-ish
                          padding: "2px 6px",
                          fontSize: 10,
                          whiteSpace: "nowrap",
                          lineHeight: 1.2,
                        }}
                      >
                        {conversation.courseName}
                      </span>
                    )}
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

      {/* Right column: courses */}
      <CoursesSection 
        onError={setError}
        resourcesSection={
          <div className="dashboard-resources">
            <h2>Resources</h2>
            <Button
              variant="contained"
              sx={{ mb: 1, width: "100%" }}
              onClick={() => navigate("/announcements")}
            >
              {userRole === "instructor" ? "Manage Announcements" : "View Announcements"}
            </Button>
            <Button
              variant="contained"
              sx={{ width: "100%" }}
              onClick={() => navigate("/materials")}
            >
              {userRole === "instructor" ? "Manage Course Materials" : "View Course Materials"}
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default Dashboard;
