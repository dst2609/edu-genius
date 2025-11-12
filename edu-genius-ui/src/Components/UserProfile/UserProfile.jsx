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

        const response = await axios.get(
          "http://localhost:3000/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
        "http://localhost:3000/users/profile",
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
          <Box component="form" onSubmit={handleSubmit} className="profile-form">
            {formError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Box className="form-section">
                  <Typography variant="h6" className="section-title">
                    📋 Basic Information
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
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
                        label="Grade Level"
                        name="gradeLevel"
                        value={formData.gradeLevel}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        className="premium-input"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        value={user.email || "N/A"}
                        fullWidth
                        variant="outlined"
                        disabled
                        className="premium-input"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box className="form-section" sx={{ mt: 3 }}>
                  <Typography variant="h6" className="section-title">
                    🌍 Location
                  </Typography>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                    <InputLabel id="region-label">Region</InputLabel>
                    <Select
                      labelId="region-label"
                      name="region"
                      value={formData.region}
                      label="Region"
                      onChange={handleInputChange}
                      className="premium-select"
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
                </Box>

                <Box className="form-section" sx={{ mt: 3 }}>
                  <Typography variant="h6" className="section-title">
                    🖼️ Profile Picture
                  </Typography>
                  <TextField
                    label="Profile Picture URL"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    className="premium-input"
                    placeholder="https://example.com/my-profile.jpg"
                    sx={{ mt: 2 }}
                  />
                </Box>

                <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    className="btn-save"
                  >
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
              </Grid>

              <Grid item xs={12} md={5}>
                <Box className="profile-picture-preview">
                  <Box
                    component="img"
                    src={formData.profilePicture || placeholderImage}
                    alt="Profile preview"
                    className="preview-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                  <Typography variant="body2" className="preview-label">
                    Profile picture preview
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Box className="profile-info-section">
                <Typography variant="h6" className="section-title">
                  👤 Personal Information
                </Typography>
                <Box className="info-grid" sx={{ mt: 3 }}>
                  <Box className="info-item">
                    <Typography className="info-label">First Name</Typography>
                    <Typography className="info-value">
                      {user?.firstname || "Not provided"}
                    </Typography>
                  </Box>
                  <Box className="info-item">
                    <Typography className="info-label">Last Name</Typography>
                    <Typography className="info-value">
                      {user?.lastname || "Not provided"}
                    </Typography>
                  </Box>
                  <Box className="info-item">
                    <Typography className="info-label">Username</Typography>
                    <Typography className="info-value">
                      {user?.username || "Not provided"}
                    </Typography>
                  </Box>
                  <Box className="info-item">
                    <Typography className="info-label">Email</Typography>
                    <Typography className="info-value">
                      {user?.email || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box className="profile-info-section" sx={{ mt: 3 }}>
                <Typography variant="h6" className="section-title">
                  🎓 Academic Information
                </Typography>
                <Box className="info-grid" sx={{ mt: 3 }}>
                  <Box className="info-item">
                    <Typography className="info-label">Grade Level</Typography>
                    <Typography className="info-value">
                      {user?.gradeLevel || "Not provided"}
                    </Typography>
                  </Box>
                  <Box className="info-item">
                    <Typography className="info-label">Region</Typography>
                    <Typography className="info-value">
                      {user?.region || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box className="profile-info-section" sx={{ mt: 3 }}>
                <Typography variant="h6" className="section-title">
                  📅 Account Information
                </Typography>
                <Box className="info-grid" sx={{ mt: 3 }}>
                  <Box className="info-item">
                    <Typography className="info-label">Joined</Typography>
                    <Typography className="info-value">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Not available"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
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
            </Grid>

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
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default UserProfile;
