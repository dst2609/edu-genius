const db = require("../db/database.js");
const { ObjectId } = require("mongodb");

const announcementController = {
  // Get all announcements
  async getAnnouncements(req, res) {
    try {
      const announcementsCollection = db.getAnnouncementsCollection();
      const usersCollection = db.getUsersCollection();
      
      const announcements = await announcementsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // Fetch instructor details for each announcement
      const announcementsWithInstructor = await Promise.all(
        announcements.map(async (announcement) => {
          try {
            const instructor = await usersCollection.findOne(
              { _id: new ObjectId(announcement.instructorId) },
              { projection: { firstname: 1, lastname: 1 } }
            );
            
            return {
              ...announcement,
              instructorName: instructor 
                ? `${instructor.firstname} ${instructor.lastname}`
                : "Unknown Instructor"
            };
          } catch (err) {
            console.error("Error fetching instructor:", err);
            return {
              ...announcement,
              instructorName: "Unknown Instructor"
            };
          }
        })
      );

      res.status(200).json({ announcements: announcementsWithInstructor });
    } catch (err) {
      console.error("Error retrieving announcements:", err);
      res.status(500).json({ error: "Failed to retrieve announcements" });
    }
  },

  // Create announcement (instructor only)
  async createAnnouncement(req, res) {
    try {
      const announcementsCollection = db.getAnnouncementsCollection();
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const newAnnouncement = {
        _id: new ObjectId(),
        title,
        content,
        instructorId: new ObjectId(req.user),
        createdAt: new Date(),
      };

      const result = await announcementsCollection.insertOne(newAnnouncement);

      if (result.acknowledged) {
        res.status(201).json({ announcement: newAnnouncement });
      } else {
        throw new Error("Failed to create announcement");
      }
    } catch (err) {
      console.error("Error creating announcement:", err);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  },

  // Delete announcement (instructor only - their own)
  async deleteAnnouncement(req, res) {
    try {
      const announcementsCollection = db.getAnnouncementsCollection();
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid announcement ID" });
      }

      const result = await announcementsCollection.deleteOne({
        _id: new ObjectId(id),
        instructorId: new ObjectId(req.user),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Announcement not found or unauthorized" });
      }

      res.status(200).json({ message: "Announcement deleted successfully" });
    } catch (err) {
      console.error("Error deleting announcement:", err);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  },
};

module.exports = announcementController;
