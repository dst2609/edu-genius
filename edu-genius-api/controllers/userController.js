const db = require("../db/database.js");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const usersCollection = db.getUsersCollection();

const userController = {
  async getAllUsers(req, res) {
    try {
      const usersCollection = db.getUsersCollection();
      const users = await usersCollection
        .find(
          {},
          {
            projection: { _id: 1, email: 1 },
          }
        )
        .toArray();

      if (users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }

      res.status(200).json(users);
    } catch (err) {
      console.error("Error retrieving users: ", err);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  },

  async getUserByEmail(req, res) {
    const email = req.params.email;
    try {
      const usersCollection = db.getUsersCollection();
      const user = await usersCollection.findOne({ email: email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (err) {
      console.error("Error retrieving user: ", err);
      res.status(500).json({ error: "Failed to retrieve user" });
    }
  },

  async regUser(req, res) {
    try {
      const usersCollection = db.getUsersCollection();

      // Check for duplicate email
      const existingUser = await usersCollection.findOne({
        email: req.body.email,
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password before saving the user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const newUser = {
        _id: new ObjectId(),
        ...req.body,
        password: hashedPassword,
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      console.log("result.acknowledged: ", result.acknowledged);
      console.log("result is: ", result);

      if (result.acknowledged) {
        res.status(201).json(result.insertedId);
      } else {
        throw new Error("Failed to register user");
      }
    } catch (err) {
      console.error("Failed to register user: ", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  },

  async loginUser(req, res) {
    try {
      const usersCollection = db.getUsersCollection();
      const user = await usersCollection.findOne({
        email: req.body.email,
      });

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!validPassword) {
        return res.status(400).json({ error: "Invalid password" });
      }

      const token = jwt.sign(
        { _id: user._id.toString() },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      console.log("token is: ", token);

      res.status(200).json({ token, message: "Logged in successfully" });
    } catch (err) {
      console.error("Failed to login user: ", err);
      res.status(500).json({ error: "Failed to login user" });
    }
  },

  async getUserProfile(req, res) {
    try {
      const usersCollection = db.getUsersCollection();
      console.log("req.user:", req.user);
      if (!ObjectId.isValid(req.user)) {
        console.log("Invalid ObjectId:", req.user);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userId = new ObjectId(req.user);
      console.log("Querying user with _id:", userId);
      const user = await usersCollection.findOne(
        { _id: userId },
        { projection: { password: 0 } }
      );

      if (!user) {
        console.log("User not found for _id:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Found user:", user);
      res.status(200).json(user);
    } catch (err) {
      console.error("Error retrieving user profile: ", err);
      res.status(500).json({ error: "Failed to retrieve user profile" });
    }
  },

  async updateUserProfile(req, res) {
    try {
      const usersCollection = db.getUsersCollection();
      if (!ObjectId.isValid(req.user)) {
        console.log("Invalid ObjectId:", req.user);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userId = new ObjectId(req.user);
      const { firstname, lastname, username, gradeLevel, region } = req.body;

      // Validate input (basic example)
      if (!firstname || !lastname || !username) {
        return res
          .status(400)
          .json({ error: "First name, last name, and username are required" });
      }

      const updateData = {
        firstname,
        lastname,
        username,
        gradeLevel: gradeLevel || "",
        region: region || "",
        updatedAt: new Date(),
      };

      const result = await usersCollection.updateOne(
        { _id: userId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        console.log("User not found for _id:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Updated user:", updateData);
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (err) {
      console.error("Error updating user profile: ", err);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  },
};

module.exports = userController;
