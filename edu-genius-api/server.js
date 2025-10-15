require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { rateLimiter } = require("./security/rateSecurity");
const { connectToDB, createUsersCollection } = require("./db/database");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimiter); // optional security

// ---------- DATABASE CONNECTIONS ----------
(async () => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("Prisma connected to MongoDB");
  } catch (err) {
    console.error("Prisma connection failed:", err);
  }
})();

connectToDB()
  .then(async () => {
    try {
      await createUsersCollection();
      console.log("Users collection ready");
    } catch (e) {
      console.warn("createUsersCollection warning:", e?.message || e);
    }

    // ---------- ROUTES ----------
    app.use("/users", userRoutes);
    app.use("/chat", chatRoutes);
    app.use("/courses", courseRoutes);

    // ---------- 404 HANDLER ----------
    app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

    // ---------- SERVER ----------
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize MongoDB:", err);
    process.exit(1);
  });
