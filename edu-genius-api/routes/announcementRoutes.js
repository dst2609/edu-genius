const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roleAuth");
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

// Get all announcements (accessible to all authenticated users)
router.get("/", auth, getAnnouncements);

// Create announcement (instructor only)
router.post("/", auth, requireRole("instructor"), createAnnouncement);

// Delete announcement (instructor only)
router.delete("/:id", auth, requireRole("instructor"), deleteAnnouncement);

module.exports = router;
