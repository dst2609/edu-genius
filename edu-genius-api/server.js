// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ✅ Prisma singleton (replaces mongoose usage for Course)
const prisma = require("./lib/prisma");

// ✅ Keep your native driver bootstrap if users/chat still need it
// (If you no longer use the native driver, you can delete these two lines)
const { connectToDB, createUsersCollection } = require("./db/database");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

// ----- middleware -----
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Optional: quick Prisma connectivity check (MongoDB-friendly)
(async () => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("✅ Prisma connected to MongoDB");
  } catch (err) {
    console.error("❌ Prisma connection failed:", err);
    process.exit(1);
  }
})();

// ----- database + server start -----
// If you're still using the native driver for users/chat, keep this.
// Otherwise, you can remove connectToDB/createUsersCollection and start app directly.
connectToDB()
  .then(async () => {
    try {
      await createUsersCollection();
    } catch (e) {
      console.warn("createUsersCollection warning:", e?.message || e);
    }

    // ----- routes -----
    app.use("/users", userRoutes);
    app.use("/chat", chatRoutes);
    app.use("/courses", courseRoutes); // now backed by Prisma

    // health check
    app.get("/health", (_req, res) => res.json({ ok: true }));

    // 404
    app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize DB:", err);
    process.exit(1);
  });
