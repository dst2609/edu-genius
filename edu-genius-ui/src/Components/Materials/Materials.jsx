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
  Link,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolIcon from "@mui/icons-material/School";
import "./Materials.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState("file"); // "file" or "url"
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role") || "student";
    setUserRole(role);
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      setError("Failed to load materials");
    }
  };

  const handleUploadMaterial = async () => {
    if (!title) {
      setError("Title is required");
      return;
    }

    if (uploadType === "file" && !selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    if (uploadType === "url" && !fileUrl) {
      setError("Please enter a file URL");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("token");

      if (uploadType === "file") {
        // Upload with file
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title);
        formData.append("description", description);

        await axios.post(
          `${API_BASE_URL}/materials/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // Upload with URL
        await axios.post(
          `${API_BASE_URL}/materials`,
          { title, description, fileUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setTitle("");
      setDescription("");
      setFileUrl("");
      setSelectedFile(null);
      setUploadType("file");
      setOpenDialog(false);
      fetchMaterials();
      setError("");
    } catch (error) {
      console.error("Error uploading material:", error);
      setError(error.response?.data?.error || "Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleDeleteMaterial = async (id) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      setError(error.response?.data?.error || "Failed to delete material");
    }
  };

  // Group materials by instructor
  const instructorGroups = materials.reduce((acc, material) => {
    const instructorName = material.instructorName || "Unknown Instructor";
    if (!acc[instructorName]) {
      acc[instructorName] = {
        name: instructorName,
        email: material.instructorEmail || "",
        materials: []
      };
    }
    acc[instructorName].materials.push(material);
    return acc;
  }, {});

  const sortedInstructors = Object.values(instructorGroups).sort((a, b) => {
    if (a.name === "Unknown Instructor") return 1;
    if (b.name === "Unknown Instructor") return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Box className="materials-container">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        {selectedInstructor ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => setSelectedInstructor(null)}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5">{selectedInstructor.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedInstructor.materials.length} material{selectedInstructor.materials.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="h5">Instructors</Typography>
        )}
        {userRole === "instructor" && !selectedInstructor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Upload Material
          </Button>
        )}
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!selectedInstructor ? (
        // Show instructors list
        materials.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align="center" color="textSecondary">
                No materials available yet
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
            {sortedInstructors.map((instructor) => (
              <Card
                key={instructor.name}
                sx={{
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3
                  }
                }}
                onClick={() => setSelectedInstructor(instructor)}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <SchoolIcon sx={{ fontSize: 40, color: "primary.main" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {instructor.name}
                      </Typography>
                      {instructor.email && (
                        <Typography variant="caption" color="textSecondary">
                          {instructor.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
                    <Chip
                      label={`${instructor.materials.length} Material${instructor.materials.length !== 1 ? 's' : ''}`}
                      color="primary"
                      size="small"
                    />
                    <Typography variant="body2" color="primary">
                      View Materials →
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )
      ) : (
        // Show materials for selected instructor
        selectedInstructor.materials.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align="center" color="textSecondary">
                No materials uploaded yet
              </Typography>
            </CardContent>
          </Card>
        ) : (
          selectedInstructor.materials.map((material) => (
            <Card key={material._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <InsertDriveFileIcon color="primary" />
                      <Typography variant="h6">
                        {material.title}
                      </Typography>
                    </Box>
                    {material.description && (
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {material.description}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                      {material.fileName && (
                        <Chip
                          label={material.fileName}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {material.fileSize && (
                        <Chip
                          label={formatFileSize(material.fileSize)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Uploaded: {new Date(material.createdAt).toLocaleDateString()}
                    </Typography>
                    <Link
                      href={material.fileUrl.startsWith("http") ? material.fileUrl : `${API_BASE_URL}${material.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <DownloadIcon fontSize="small" />
                      Download/View Material
                    </Link>
                  </Box>
                  {userRole === "instructor" && (
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteMaterial(material._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
        )
      )}

      {/* Upload Material Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload Course Material</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 2 }}>
            <ToggleButtonGroup
              value={uploadType}
              exclusive
              onChange={(e, newType) => {
                if (newType) {
                  setUploadType(newType);
                  setError("");
                }
              }}
              fullWidth
            >
              <ToggleButton value="file">
                <CloudUploadIcon sx={{ mr: 1 }} />
                Upload File
              </ToggleButton>
              <ToggleButton value="url">
                <LinkIcon sx={{ mr: 1 }} />
                External URL
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

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
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          {uploadType === "file" ? (
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                {selectedFile ? "Change File" : "Select File"}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.zip,.rar"
                />
              </Button>
              {selectedFile && (
                <Box sx={{ mt: 1, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                Max file size: 50MB. Supported: PDF, DOC, PPT, XLS, TXT, images, videos, archives
              </Typography>
            </Box>
          ) : (
            <TextField
              margin="dense"
              label="File URL"
              fullWidth
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              helperText="Enter the URL of the file (Google Drive, Dropbox, etc.)"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadMaterial}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Materials;
