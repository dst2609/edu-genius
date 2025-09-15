import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

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
    </Box>
  );
};

export default Dashboard;
