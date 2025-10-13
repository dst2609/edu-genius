const Course = require("../models/courseModel");

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user }).sort({ updatedAt: -1 });
    res.json({ courses });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, percent } = req.body;
    const cleanName = (name || "").trim();
    const pct = Number.isFinite(+percent) ? Math.max(0, Math.min(100, +percent)) : 0;

    if (!cleanName) return res.status(400).json({ error: "Course name is required" });

    const course = await Course.create({
      userId: req.user,
      name: cleanName,
      percent: pct
    });
    res.status(201).json({ course });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create course" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (typeof req.body.name === "string") updates.name = req.body.name.trim();
    if (req.body.percent !== undefined) {
      updates.percent = Math.max(0, Math.min(100, Number(req.body.percent) || 0));
    }

    const course = await Course.findOneAndUpdate(
      { _id: id, userId: req.user },
      { $set: updates },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ course });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update course" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Course.findOneAndDelete({ _id: id, userId: req.user });
    if (!deleted) return res.status(404).json({ error: "Course not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete course" });
  }
};