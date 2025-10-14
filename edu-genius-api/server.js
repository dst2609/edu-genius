require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { connectToDB, createUsersCollection } = require("./db/database");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

// ----- middleware -----
app.use(cors());
app.use(express.json({ limit: "1mb" }));

(async () => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("Prisma connected to MongoDB");
  } catch (err) {
    console.error("Prisma connection failed:", err);
    process.exit(1);
  }
})();

connectToDB()
  .then(async () => {
    try {
      await createUsersCollection();
    } catch (e) {
      console.warn("createUsersCollection warning:", e?.message || e);
    }

    app.use("/users", userRoutes);
    app.use("/chat", chatRoutes);
    app.use("/courses", courseRoutes);
    app.get("/health", (_req, res) => res.json({ ok: true }));

    app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize DB:", err);
    process.exit(1);
  });
