require("dotenv").config(); // Load environment variables from .env file
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

// Rate limiter for security
const { rateLimiter } = require("./security/rateSecurity");

//user routers and db connection:
const { connectToDB, createUsersCollection } = require("./db/database.js");

const app = express();

// Morgan middleware for logging requests
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
//use rate limiter here
// app.use(rateLimiter);

app.use(morgan("dev"));

// Connect to MongoDB
connectToDB().then(() => {
  //Create users collection
  createUsersCollection();

  // Routes
  const userRoutes = require("./routes/userRoutes");
  const chatRoutes = require("./routes/chatRoutes");
  app.use("/users", userRoutes);
  app.use("/chat", chatRoutes);

  // Start the server
  app.listen(3000, () => {
    console.log("Server started on port 3000");
  });
});
