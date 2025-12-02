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
import LandingPage from "./Components/LandingPage/LandingPage";
import Contact from "./Components/Contact/Contact";
import Announcements from "./Components/Announcements/Announcements";
import Materials from "./Components/Materials/Materials";
import { Button, Box, Container } from "@mui/material";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/materials" element={<Materials />} />
      </Routes>
    </Router>
  );
};

export default App;
