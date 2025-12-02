import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Alert } from "@mui/material";
import "./Login.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill out all fields");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password,
      });
      const { token, role } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role || "student");
      setToken(token);
      navigate("/dashboard");
    } catch (error) {
      console.log("error: ", error);
      setError(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Login</h2>
        {error && (
          <Alert severity="error" sx={{ mb: "14px" }}>
            {error}
          </Alert>
        )}
        <input
          type="text"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
};

export default Login;
