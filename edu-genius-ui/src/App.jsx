import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Register from "./Components/Register/Register";
import Login from "./Components/Login/Login";
import Header from "./Components/Header/Header";
import AboutUs from "./Components/AboutUs/AboutUs";
import ContactUs from "./Components/ContactUs/ContactUs";
import Features from "./Components/Features/Features";
import { Button, Box } from "@mui/material";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        mt: 6,
        px: 2,
        pb: 10,
        background:
          "radial-gradient(1200px 600px at 50% -10%, #E8F1FF 0%, rgba(232,241,255,0) 60%)",
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto", textAlign: "center" }}>
        <Box sx={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Learn Smarter with{" "}
          <Box component="span" sx={{ color: "#2563EB" }}>
            EduGenius
          </Box>
        </Box>

        <Box sx={{ mt: 1, color: "#6B7280", fontSize: 16 }}>
          AI-powered personalized learning paths, insights, and practice—tailored
          to you.
        </Box>

        <Box
          sx={{
            mt: 4,
            display: "inline-flex",
            gap: 1,
            p: 1,
            borderRadius: "999px",
            backgroundColor: "#F3F4F6",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <Button
            variant="contained"
            sx={{ m: 0 }}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            variant="outlined"
            sx={{ m: 0 }}
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
          <Button
            variant="outlined"
            sx={{ m: 0 }}
            onClick={() => navigate("/about")}
          >
            About Us
          </Button>
          <Button
            variant="outlined"
            sx={{ m: 0 }}
            onClick={() => navigate("/contact")}
          >
            Contact Us
          </Button>
          <Button
            variant="outlined"
            sx={{ m: 0 }}
            onClick={() => navigate("/features")}
          >
            Features
          </Button>
        </Box>

        <Box
          sx={{
            mt: 4,
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {["Personalized Paths", "AI Tutor Assistance", "Progress Insights"].map(
            (t) => (
              <Box
                key={t}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: "12px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  fontSize: 14,
                  color: "#374151",
                }}
              >
                {t}
              </Box>
            )
          )}
        </Box>

        <Box sx={{ mt: 10, py: 4, color: "#6B7280", fontSize: 13 }}>
          © {new Date().getFullYear()} EduGenius — Learn smarter, not harder.
        </Box>
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/features" element={<Features />} />
      </Routes>
    </Router>
  );
};

export default App;
