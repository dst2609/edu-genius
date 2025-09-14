const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded._id; // Matches _id in JWT payload from loginUser
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Define user routes
router.get("/", userController.getAllUsers);
router.post("/register", userController.regUser);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.post("/login", userController.loginUser);
router.get("/:email", userController.getUserByEmail);

module.exports = router;
