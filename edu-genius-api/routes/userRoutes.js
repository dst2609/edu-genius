const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

// Define user routes
router.get("/", userController.getAllUsers);
router.post("/register", userController.regUser);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.put("/profile", authMiddleware, userController.updateUserProfile);
router.post("/login", userController.loginUser);
router.get("/:email", userController.getUserByEmail);

module.exports = router;
