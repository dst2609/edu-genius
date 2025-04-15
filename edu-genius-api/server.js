require("dotenv").config(); // Load environment variables from .env file
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

//user routers and db connection:
const { connectToDB, createUsersCollection } = require("./db/database.js");

const app = express();

// Morgan middleware for logging requests
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use(morgan("dev"));

// Connect to MongoDB
connectToDB().then(() => {
  //Create users collection
  createUsersCollection();

  // Routes
  const userRoutes = require("./routes/userRoutes");
  app.use("/users", userRoutes);

  // Start the server
  app.listen(3000, () => {
    console.log("Server started on port 3000");
  });
});
