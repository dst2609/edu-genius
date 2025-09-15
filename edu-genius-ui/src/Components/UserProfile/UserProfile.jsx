import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from "@mui/material";
import axios from "axios";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your profile");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          "http://localhost:3000/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUser(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch profile");
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
      <Box sx={{ mt: 4 }}>
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
    <Paper sx={{ p: 4, mt: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          First Name: {user?.firstname || "N/A"}
        </Typography>
        <Typography variant="body1">
          Last Name: {user?.lastname || "N/A"}
        </Typography>
        <Typography variant="body1">
          Username: {user?.username || "N/A"}
        </Typography>
        <Typography variant="body1">Email: {user?.email || "N/A"}</Typography>
        <Typography variant="body1">
          Joined:{" "}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "N/A"}
        </Typography>
      </Box>
      <Button variant="contained" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </Paper>
  );
};

export default UserProfile;
