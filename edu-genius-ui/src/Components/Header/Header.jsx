import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("token");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (event) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleNavigate = (path) => {
    navigate(path);
    closeMenu();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    handleNavigate("/login");
  };

  const getAuthButton = () => {
    if (location.pathname === "/register") {
      return (
        <Button color="inherit" onClick={() => handleNavigate("/login")}>
          Login
        </Button>
      );
    }
    if (location.pathname === "/login") {
      return (
        <Button color="inherit" onClick={() => handleNavigate("/register")}>
          Register
        </Button>
      );
    }
    return (
      <Button
        color="inherit"
        onClick={isLoggedIn ? handleLogout : () => handleNavigate("/login")}
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
        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              edge="end"
              aria-label="menu"
              onClick={openMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={() => handleNavigate("/")}>Home</MenuItem>
              <MenuItem onClick={() => handleNavigate("/dashboard")}>
                Dashboard
              </MenuItem>
              <MenuItem onClick={() => handleNavigate("/profile")}>
                Profile
              </MenuItem>
              <MenuItem
                onClick={
                  isLoggedIn ? handleLogout : () => handleNavigate("/login")
                }
              >
                {isLoggedIn ? "Logout" : "Login"}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
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
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
