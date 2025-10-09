// controllers/courseController.js
const db = require("../db/database.js");
const { ObjectId } = require("mongodb");

const courseController = {
  async getCourses(req, res) {
    try {
      if (!ObjectId.isValid(req.user)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const userId = new ObjectId(req.user);
      const coursesCollection = db.getCoursesCollection();

      const courses = await coursesCollection
        .find(
          { userId },
          { projection: { _id: 1, name: 1, percent: 1, createdAt: 1, updatedAt: 1 } }
        )
        .sort({ createdAt: 1 })
        .toArray();

      res.status(200).json({ courses });
    } catch (err) {
      console.error("Error retrieving courses:", err);
      res.status(500).json({ message: "Failed to retrieve courses" });
    }
  },

  async addCourse(req, res) {
    try {
      if (!ObjectId.isValid(req.user)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const userId = new ObjectId(req.user);
      const coursesCollection = db.getCoursesCollection();

      const { name, percent } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Course name is required" });
      }
      const pct = Number(percent);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ message: "Percent must be between 0 and 100" });
      }

      const existing = await coursesCollection.findOne({ userId, name: name.trim() });
      if (existing) {
        return res.status(409).json({ message: "You already have a course with this name" });
      }

      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        userId,
        name: name.trim(),
        percent: pct,
        createdAt: now,
        updatedAt: now,
      };

      const result = await coursesCollection.insertOne(doc);
      if (!result.acknowledged) throw new Error("Insert not acknowledged");

      res.status(201).json({ course: doc });
    } catch (err) {
      console.error("Error creating course:", err);
      res.status(500).json({ message: "Failed to create course" });
    }
  },

  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      if (!ObjectId.isValid(req.user)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const coursesCollection = db.getCoursesCollection();

      const userId = new ObjectId(req.user);
      const courseId = new ObjectId(id);

      const { name, percent } = req.body;
      const update = { updatedAt: new Date() };

      if (name !== undefined) {
        if (!name || typeof name !== "string" || !name.trim()) {
          return res.status(400).json({ message: "Course name is required" });
        }
        update.name = name.trim();
      }
      if (percent !== undefined) {
        const pct = Number(percent);
        if (Number.isNaN(pct) || pct < 0 || pct > 100) {
          return res.status(400).json({ message: "Percent must be between 0 and 100" });
        }
        update.percent = pct;
      }

      if (update.name) {
        const dup = await coursesCollection.findOne({
          userId,
          name: update.name,
          _id: { $ne: courseId },
        });
        if (dup) {
          return res.status(409).json({ message: "You already have a course with this name" });
        }
      }

      const result = await coursesCollection.updateOne(
        { _id: courseId, userId },
        { $set: update }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Course not found" });
      }

      const updated = await coursesCollection.findOne(
        { _id: courseId },
        { projection: { _id: 1, name: 1, percent: 1, createdAt: 1, updatedAt: 1 } }
      );

      res.status(200).json({ course: updated });
    } catch (err) {
      console.error("Error updating course:", err);
      res.status(500).json({ message: "Failed to update course" });
    }
  },

  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      if (!ObjectId.isValid(req.user)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const coursesCollection = db.getCoursesCollection();

      const userId = new ObjectId(req.user);
      const courseId = new ObjectId(id);

      const result = await coursesCollection.deleteOne({ _id: courseId, userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.status(200).json({ message: "Course deleted" });
    } catch (err) {
      console.error("Error deleting course:", err);
      res.status(500).json({ message: "Failed to delete course" });
    }
  },
};

module.exports = courseController;
