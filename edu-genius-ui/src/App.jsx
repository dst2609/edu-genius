import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Header from "./Components/Header/Header";
import Register from "./Components/Register/Register";
import Login from "./Components/Login/Login";
import Dashboard from "./Components/Dashboard/Dashboard";
import UserProfile from "./Components/UserProfile/UserProfile";
import Chatbot from "./Components/Chatbot/Chatbot.jsx";
import { Button, Box, Container } from "@mui/material";

const NavigationButtons = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: "center", mt: 4 }}>
      <Button
        variant="contained"
        sx={{ m: 1 }}
        onClick={() => navigate("/dashboard")}
      >
        Dashboard
      </Button>
      <Button
        variant="contained"
        sx={{ m: 1 }}
        onClick={() => navigate("/profile")}
      >
        Profile
      </Button>

    </Box>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  return (
    <Router>
      <Header />
      <Container maxWidth="sm">
        <Routes>
          <Route path="/" element={<NavigationButtons />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/chat" element={<Chatbot />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
