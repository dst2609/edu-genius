import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Register from "./Components/Register/Register";
import Login from "./Components/Login/Login";
import { Button, Box, Container } from "@mui/material";

const NavigationButtons = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: "center", mt: 4 }}>
      <Button
        variant="contained"
        sx={{ m: 1 }}
        onClick={() => navigate("/login")}
      >
        Login
      </Button>
      <Button
        variant="outlined"
        sx={{ m: 1 }}
        onClick={() => navigate("/register")}
      >
        Register
      </Button>
    </Box>
  );
};

const App = () => {
  return (
    <Router>
      <Container maxWidth="sm">
        <NavigationButtons />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
