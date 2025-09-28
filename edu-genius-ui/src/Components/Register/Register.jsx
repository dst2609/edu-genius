import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import "./register.css";

const Register = () => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [region, setRegion] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (
      !firstname ||
      !lastname ||
      !username ||
      !email ||
      !password ||
      !gradeLevel ||
      !region
    ) {
      setError("Please fill out all fields");
      return;
    }

    try {
      await axios.post("http://localhost:3000/users/register", {
        firstname,
        lastname,
        username,
        email,
        password,
        gradeLevel,
        region,
      });
      navigate("/login");
    } catch (error) {
      console.log("error: ", error);
      setError(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="register-page">
      {/* left illustration */}
      <div className="register-illustration"></div>

      {/* right form */}
      <div className="register-form-wrapper">
        <div className="register-card">
          <h2>Register</h2>
          {error && (
            <Alert severity="error" sx={{ mb: "14px" }}>
              {error}
            </Alert>
          )}
          <input
            type="text"
            placeholder="First Name"
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            onChange={(e) => setLastname(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
          <input
            type="text"
            placeholder="Grade Level"
            onChange={(e) => setGradeLevel(e.target.value)}
            required
          />
          <FormControl fullWidth sx={{ mb: "14px" }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={region}
              label="Region"
              onChange={(e) => setRegion(e.target.value)}
              required
            >
              <MenuItem value="North America">North America</MenuItem>
              <MenuItem value="Central/South America">
                Central/South America
              </MenuItem>
              <MenuItem value="Europe">Europe</MenuItem>
              <MenuItem value="Asia">Asia</MenuItem>
              <MenuItem value="Australia">Australia</MenuItem>
              <MenuItem value="Universal">Universal</MenuItem>
            </Select>
          </FormControl>
          <button onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
