import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your dashboard");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:3000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch user");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

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

  // Example courses
  const courses = [
    { name: "DSA (CMPE 126)", percent: 86 },
    { name: "Mathematical Engineering", percent: 93 },
    { name: "Computer Architecture", percent: 81 },
  ];

  useEffect(() => {
    const verifyLogin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your dashboard");
          setLoading(false);
          return;
        }

        // Verify token by fetching profile (same as UserProfile)
        await axios.get("http://localhost:3000/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to verify login");
        setLoading(false);
      }
    };

    verifyLogin();
  }, []);

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
      <div className="dashboard-profile">
        <h2>Student Details</h2>
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

      <div className="dashboard-courses">
        <h2>Courses & Test Scores</h2>
        <div className="courses-list">
          {courses.map((course, idx) => (
            <div className="course-card" key={idx}>
              <div className="course-title">{course.name}</div>
              <div className="course-percent">{course.percent}%</div>
            </div>
          ))}
        </div>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/chat")}
          >
            ChatBot
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default Dashboard;
