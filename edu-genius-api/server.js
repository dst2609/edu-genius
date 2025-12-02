require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { rateLimiter } = require("./security/rateSecurity");
const { 
  connectToDB, 
  createUsersCollection,
  createAnnouncementsCollection,
  createMaterialsCollection
} = require("./db/database");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const courseRoutes = require("./routes/courseRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const materialRoutes = require("./routes/materialRoutes");

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
// app.use(rateLimiter); // optional security

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

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
      await createAnnouncementsCollection();
      console.log("Announcements collection ready");
      await createMaterialsCollection();
      console.log("Materials collection ready");
    } catch (e) {
      console.warn("Collection creation warning:", e?.message || e);
    }

    // ---------- ROUTES ----------
    app.use("/users", userRoutes);
    app.use("/chat", chatRoutes);
    app.use("/courses", courseRoutes);
    app.use("/announcements", announcementRoutes);
    app.use("/materials", materialRoutes);

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
