// db.js
require("dotenv").config();
const { MongoClient } = require("mongodb");

// MongoDB connection string
const mongoURI = process.env.MONGO_URI;

let db;
let usersCollection;
let announcementsCollection;
let materialsCollection;

async function connectToDB() {
  try {
    const client = await MongoClient.connect(mongoURI, {});
    db = client.db("EduGenius"); // Explicitly specify the database name here
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

async function createUsersCollection() {
  try {
    usersCollection = db.collection("users");
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(
      (collection) => collection.name === "users"
    );
    if (!collectionExists) {
      await usersCollection.createIndex({ title: "text" }); // Optional: Create an index for text search
      console.log("usersCollection collection created");
    }
  } catch (err) {
    console.error("Failed to create usersCollection :", err);
    process.exit(1);
  }
}

async function createAnnouncementsCollection() {
  try {
    announcementsCollection = db.collection("announcements");
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(
      (collection) => collection.name === "announcements"
    );
    if (!collectionExists) {
      await announcementsCollection.createIndex({ createdAt: -1 });
      console.log("announcements collection created");
    }
  } catch (err) {
    console.error("Failed to create announcements collection:", err);
    process.exit(1);
  }
}

async function createMaterialsCollection() {
  try {
    materialsCollection = db.collection("materials");
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(
      (collection) => collection.name === "materials"
    );
    if (!collectionExists) {
      await materialsCollection.createIndex({ courseId: 1, createdAt: -1 });
      console.log("materials collection created");
    }
  } catch (err) {
    console.error("Failed to create materials collection:", err);
    process.exit(1);
  }
}

function getUsersCollection() {
  return usersCollection;
}

function getAnnouncementsCollection() {
  return announcementsCollection;
}

function getMaterialsCollection() {
  return materialsCollection;
}

module.exports = {
  connectToDB,
  createUsersCollection,
  createAnnouncementsCollection,
  createMaterialsCollection,
  getUsersCollection,
  getAnnouncementsCollection,
  getMaterialsCollection,
};
