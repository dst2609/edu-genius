import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import "./UserProfile.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    gradeLevel: "",
    region: "",
    profilePicture: "",
  });
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();
  const placeholderImage = "https://picsum.photos/200/300";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your profile");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
        setFormData({
          firstname: response.data.firstname || "",
          lastname: response.data.lastname || "",
          username: response.data.username || "",
          gradeLevel: response.data.gradeLevel || "",
          region: response.data.region || "",
          profilePicture: response.data.profilePicture || "",
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch profile");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setFormError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/users/profile`,
        {
          firstname: formData.firstname,
          lastname: formData.lastname,
          username: formData.username,
          gradeLevel: formData.gradeLevel,
          region: formData.region,
          profilePicture: formData.profilePicture,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser((prev) => ({
        ...prev,
        firstname: formData.firstname,
        lastname: formData.lastname,
        username: formData.username,
        gradeLevel: formData.gradeLevel,
        region: formData.region,
        profilePicture: formData.profilePicture,
      }));
      setIsEditing(false);
      setFormError(null);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: "auto" }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/login")}
        >
          Go to Login
        </Button>
      </Box>
    );
  }
  return (
    <Box className="profile-container">
      <Box className="profile-header">
        <Typography variant="h3" className="profile-title">
          My Profile
        </Typography>
        <Typography variant="body1" className="profile-subtitle">
          Manage your account information and preferences
        </Typography>
      </Box>

      <Box className="profile-main">
        {isEditing ? (
          <Box
            component="form"
            onSubmit={handleSubmit}
            className="profile-form"
          >
            <Box className="form-section">
              <Typography variant="h6" className="section-title">
                ✏️ Edit Profile Information
              </Typography>

              <Box className="edit-container">
                {/* Profile Picture - Left Side */}
                <Box className="edit-picture-section">
                  <Box className="edit-picture-preview">
                    <Box
                      component="img"
                      src={formData.profilePicture || placeholderImage}
                      alt="Profile preview"
                      className="edit-preview-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                    <Typography variant="body2" className="edit-preview-label">
                      Profile picture preview
                    </Typography>
                  </Box>
                </Box>

                {/* Form Fields - Right Side */}
                <Box className="edit-fields-section">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        className="premium-input"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        className="premium-input"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        className="premium-input"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        value={user.email || "N/A"}
                        fullWidth
                        variant="outlined"
                        disabled
                        className="premium-input"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Grade Level"
                        name="gradeLevel"
                        value={formData.gradeLevel}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        className="premium-input"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="region-label">Region</InputLabel>
                        <Select
                          labelId="region-label"
                          name="region"
                          value={formData.region}
                          label="Region"
                          onChange={handleInputChange}
                          className="premium-select"
                        >
                          <MenuItem value="North America">
                            North America
                          </MenuItem>
                          <MenuItem value="Central/South America">
                            Central/South America
                          </MenuItem>
                          <MenuItem value="Europe">Europe</MenuItem>
                          <MenuItem value="Asia">Asia</MenuItem>
                          <MenuItem value="Australia">Australia</MenuItem>
                          <MenuItem value="Universal">Universal</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Profile Picture URL"
                        name="profilePicture"
                        value={formData.profilePicture}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        className="premium-input"
                        placeholder="https://example.com/my-profile.jpg"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Box className="edit-actions">
                <Button type="submit" variant="contained" className="btn-save">
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleEditToggle}
                  className="btn-cancel"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                onClick={handleEditToggle}
                className="btn-edit"
              >
                ✏️ Edit Profile
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/dashboard")}
                className="btn-back"
              >
                ← Back to Dashboard
              </Button>
            </Box>

            <Grid container spacing={3} sx={{ alignItems: "center" }}>
              <Grid item xs={12} md={5}>
                <Box className="profile-picture-card">
                  <Box
                    component="img"
                    src={user?.profilePicture || placeholderImage}
                    alt="Profile"
                    className="profile-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                  <Typography variant="body2" className="profile-image-label">
                    {user?.firstname} {user?.lastname}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={7}>
                <Box
                  className="profile-info-section"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="h6"
                    className="section-title"
                    sx={{
                      mb: 2,
                      textDecoration: "none !important",
                      borderBottom: "none !important",
                    }}
                  >
                    📋 Profile Information
                  </Typography>
                  <Box
                    className="info-grid"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                      gap: 2,
                      flex: 1,
                    }}
                  >
                    <Box className="info-item" sx={{ mb: 1 }}>
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        First Name
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.firstname || "Not provided"}
                      </Typography>
                    </Box>
                    <Box className="info-item" sx={{ mb: 1 }}>
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Last Name
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.lastname || "Not provided"}
                      </Typography>
                    </Box>
                    <Box className="info-item" sx={{ mb: 1 }}>
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Username
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.username || "Not provided"}
                      </Typography>
                    </Box>
                    <Box className="info-item" sx={{ mb: 1 }}>
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Email
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.email || "Not provided"}
                      </Typography>
                    </Box>
                    <Box className="info-item" sx={{ mb: 1 }}>
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Grade Level
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.gradeLevel || "Not provided"}
                      </Typography>
                    </Box>
                    <Box className="info-item" sx={{ mb: 1 }}>
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Region
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.region || "Not provided"}
                      </Typography>
                    </Box>
                    <Box
                      className="info-item"
                      sx={{ mb: 1, gridColumn: { sm: "span 2" } }}
                    >
                      <Typography
                        className="info-label"
                        sx={{ fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Joined
                      </Typography>
                      <Typography
                        className="info-value"
                        sx={{ fontSize: "1rem" }}
                      >
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "Not available"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default UserProfile;
