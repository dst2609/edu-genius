const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require("../controllers/courseController");

router.use(auth);

router.get("/", listCourses);
router.post("/", createCourse);
router.patch("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;