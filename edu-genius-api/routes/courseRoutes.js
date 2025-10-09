// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const courseController = require("../controllers/courseController");

// No requireAuth here now; it's mounted in server.js

router.get("/", courseController.getCourses);
router.post("/", courseController.addCourse);
router.patch("/:id", courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
