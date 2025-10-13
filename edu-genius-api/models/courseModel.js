const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    // store as STRING so it works with Prisma/UUID/Mongo ids
    userId: { type: String, required: true, index: true },
    name:   { type: String, required: true, trim: true },
    percent:{ type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);