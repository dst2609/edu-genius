import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your dashboard");
          setLoading(false);
          return;
        }
        const response = await fetch("http://localhost:3000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch user");
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  if (loading) {
    return <Box sx={{ mt: 4, ml: 4 }}><Typography>Loading...</Typography></Box>;
  }
  if (error) {
    return <Box sx={{ mt: 4, ml: 4 }}><Typography color="error">{error}</Typography></Box>;
  }

  // Example courses and scores (replace with dynamic data if available)
  const courses = [
    { name: "DSA(CMPE 126)",  percent: 86 },
    { name: "Mathematical Engineering",  percent: 93 },
    { name: "Computer Architecture",  percent: 81 },
    
  ];

  return (
    <div className="dashboard-container" style={{ margin: "40px 0 0 0" }}>
      <div className="dashboard-profile">
        <h2>Student Details</h2>
        <div className="profile-field"><span className="profile-label">First Name:</span> <span className="profile-value">{user?.firstname || "N/A"}</span></div>
        <div className="profile-field"><span className="profile-label">Last Name:</span> <span className="profile-value">{user?.lastname || "N/A"}</span></div>
        <div className="profile-field"><span className="profile-label">Username:</span> <span className="profile-value">{user?.username || "N/A"}</span></div>
        <div className="profile-field"><span className="profile-label">Grade Level:</span> <span className="profile-value">{user?.gradeLevel || "N/A"}</span></div>
        <div className="profile-field"><span className="profile-label">Region:</span> <span className="profile-value">{user?.region || "N/A"}</span></div>
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
              <div className="course-score">{course.score}</div>
              <div className="course-percent">{course.percent}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;