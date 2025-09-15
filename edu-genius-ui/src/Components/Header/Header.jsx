import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getAuthButton = () => {
    if (location.pathname === "/register") {
      return (
        <Button color="inherit" onClick={() => navigate("/login")}>
          Login
        </Button>
      );
    }
    if (location.pathname === "/login") {
      return (
        <Button color="inherit" onClick={() => navigate("/register")}>
          Register
        </Button>
      );
    }
    return (
      <Button
        color="inherit"
        onClick={isLoggedIn ? handleLogout : () => navigate("/login")}
      >
        {isLoggedIn ? "Logout" : "Login"}
      </Button>
    );
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          EduGenius
        </Typography>
        <Button color="inherit" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button color="inherit" onClick={() => navigate("/dashboard")}>
          Dashboard
        </Button>
        <Button color="inherit" onClick={() => navigate("/profile")}>
          Profile
        </Button>
        {getAuthButton()}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
