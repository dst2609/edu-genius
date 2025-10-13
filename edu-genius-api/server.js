require("dotenv").config();
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");                 

const { rateLimiter } = require("./security/rateSecurity");
const { connectToDB, createUsersCollection } = require("./db/database.js");

const app = express();

// middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());                             

// ⬅ connect Mongoose for Course model
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "EduGenius",
  })
  .then(() => console.log("Mongoose connected"))
  .catch((err) => console.error("Mongoose connection error:", err));

connectToDB().then(() => {
  createUsersCollection();

  const userRoutes = require("./routes/userRoutes");
  const chatRoutes = require("./routes/chatRoutes");
  const courseRoutes = require("./routes/courseRoutes"); 

  app.use("/users", userRoutes);
  app.use("/chat", chatRoutes);
  app.use("/courses", courseRoutes);                    

  app.listen(3000, () => console.log("Server started on port 3000"));
});
