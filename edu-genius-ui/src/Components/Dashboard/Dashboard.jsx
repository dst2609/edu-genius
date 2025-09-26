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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    <Box sx={{ mt: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome to your dashboard!
      </Typography>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => navigate("/profile")}
      >
        View Profile
      </Button>
    <br/>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => navigate("/chat")}
      >
        ChatBot
      </Button>
    </Box>
  );
};

export default Dashboard;
