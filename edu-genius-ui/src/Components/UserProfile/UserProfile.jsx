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
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        mt: 4,
        maxWidth: 800,
        mx: "auto",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        User Profile
      </Typography>
      {isEditing ? (
        <Box component="form" onSubmit={handleSubmit}>
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="region-label">Region</InputLabel>
                    <Select
                      labelId="region-label"
                      name="region"
                      value={formData.region}
                      label="Region"
                      onChange={handleInputChange}
                      sx={{
                        textAlign: "left",
                        minWidth: "200px",
                        "& .MuiSelect-select": {
                          padding: "12px 14px",
                        },
                      }}
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Profile Picture URL"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    placeholder="https://example.com/my-profile.jpg"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    value={user.email || "N/A"}
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ mr: 2, px: 3, py: 1 }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleEditToggle}
                    sx={{ px: 3, py: 1 }}
                  >
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  border: "1px dashed",
                  borderColor: "grey.400",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Box
                  component="img"
                  src={formData.profilePicture || placeholderImage}
                  alt="Profile preview"
                  sx={{
                    width: 180,
                    height: 180,
                    objectFit: "cover",
                    borderRadius: "50%",
                    mb: 2,
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderImage;
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  Profile picture preview
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                First Name: {user?.firstname || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Last Name: {user?.lastname || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Username: {user?.username || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Email: {user?.email || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Grade Level: {user?.gradeLevel || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Region: {user?.region || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Joined:{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleEditToggle}
              sx={{ mr: 2, px: 3, py: 1 }}
            >
              Edit Profile
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard")}
              sx={{ px: 3, py: 1 }}
            >
              Back to Dashboard
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                border: "1px dashed",
                borderColor: "grey.400",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Box
                component="img"
                src={user?.profilePicture || placeholderImage}
                alt="Profile"
                sx={{
                  width: 180,
                  height: 180,
                  objectFit: "cover",
                  borderRadius: "50%",
                  mb: 2,
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholderImage;
                }}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                Profile picture
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default UserProfile;
