import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import "./Announcements.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role") || "student";
    setUserRole(role);
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError("Failed to load announcements");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!title || !content) {
      setError("Title and content are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/announcements`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle("");
      setContent("");
      setOpenDialog(false);
      fetchAnnouncements();
      setError("");
    } catch (error) {
      console.error("Error creating announcement:", error);
      setError(error.response?.data?.error || "Failed to create announcement");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setError(error.response?.data?.error || "Failed to delete announcement");
    }
  };

  return (
    <Box className="announcements-container">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Announcements</Typography>
        {userRole === "instructor" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Announcement
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {announcements.length === 0 ? (
        <Card>
          <CardContent>
            <Typography align="center" color="textSecondary">
              No announcements yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        announcements.map((announcement) => (
          <Card key={announcement._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {announcement.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Posted by <strong>{announcement.instructorName}</strong> on{" "}
                    {new Date(announcement.createdAt).toLocaleDateString()} at{" "}
                    {new Date(announcement.createdAt).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body1">{announcement.content}</Typography>
                </Box>
                {userRole === "instructor" && (
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Announcement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAnnouncement} variant="contained">
            Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Announcements;
