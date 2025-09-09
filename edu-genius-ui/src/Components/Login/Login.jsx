import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = ({ setToken }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3000/users/login", {
        username,
        password,
      });
      setToken(response.data.token);
      navigate("/dashboard");
    } catch (error) {
      console.log("error: ", error);
      alert("Login failed");
    }
  };

  return (
     <div className="login-page">
      <div className="login-card">
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
     </div>
  );
};

export default Login;
