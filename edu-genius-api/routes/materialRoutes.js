const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roleAuth");
const upload = require("../middleware/upload");
const {
  getMaterials,
  uploadMaterial,
  uploadMaterialWithFile,
  deleteMaterial,
  fixMaterialsWithoutInstructor,
  proxyFile,
} = require("../controllers/materialController");

// Get all materials (accessible to all authenticated users)
router.get("/", auth, getMaterials);

// Fix materials without instructor (instructor only)
router.post("/fix-instructor", auth, requireRole("instructor"), fixMaterialsWithoutInstructor);

// Upload material with file (instructor only)
router.post("/upload", auth, requireRole("instructor"), upload.single("file"), uploadMaterialWithFile);

// Upload material with URL (instructor only) - kept for backward compatibility
router.post("/", auth, requireRole("instructor"), uploadMaterial);

// Delete material (instructor only)
router.delete("/:id", auth, requireRole("instructor"), deleteMaterial);

// Proxy file download (accessible to all authenticated users)
// Support token in query param for direct browser download
router.get("/download/:id", (req, res, next) => {
  // Check if token is in query params (for direct browser downloads)
  const queryToken = req.query.token;
  if (queryToken && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
}, auth, proxyFile);

module.exports = router;
