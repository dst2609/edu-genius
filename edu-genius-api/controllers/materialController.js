const db = require("../db/database.js");
const { ObjectId } = require("mongodb");

const materialController = {
  // Get all materials (optionally filter by courseId)
  async getMaterials(req, res) {
    try {
      const materialsCollection = db.getMaterialsCollection();
      const usersCollection = db.getUsersCollection();
      const { courseId } = req.query;

      const query = courseId ? { courseId } : {};
      const materials = await materialsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      // Fetch instructor information for each material
      const materialsWithInstructor = await Promise.all(
        materials.map(async (material) => {
          let instructor = null;
          
          // Try to find instructor if instructorId exists
          if (material.instructorId) {
            try {
              // instructorId might already be an ObjectId or a string
              const instructorId = material.instructorId instanceof ObjectId 
                ? material.instructorId 
                : new ObjectId(material.instructorId);
              
              instructor = await usersCollection.findOne(
                { _id: instructorId },
                { projection: { name: 1, firstname: 1, lastname: 1, email: 1 } }
              );
            } catch (err) {
              console.error("Error finding instructor:", err.message);
            }
          }
          
          // Construct instructor name from firstname/lastname or name field
          const instructorName = instructor 
            ? (instructor.name || `${instructor.firstname || ''} ${instructor.lastname || ''}`.trim() || "Unknown Instructor")
            : "Unknown Instructor";
          
          return {
            ...material,
            instructorName,
            instructorEmail: instructor?.email || "",
          };
        })
      );

      res.status(200).json({ materials: materialsWithInstructor });
    } catch (err) {
      console.error("Error retrieving materials:", err);
      res.status(500).json({ error: "Failed to retrieve materials" });
    }
  },

  // Upload material (instructor only)
  async uploadMaterial(req, res) {
    try {
      const materialsCollection = db.getMaterialsCollection();
      const { title, description, fileUrl, courseId } = req.body;

      if (!title || !fileUrl) {
        return res.status(400).json({ error: "Title and file URL are required" });
      }

      const newMaterial = {
        _id: new ObjectId(),
        title,
        description: description || "",
        fileUrl,
        fileName: null,
        fileSize: null,
        fileType: null,
        courseId: courseId || null,
        instructorId: new ObjectId(req.user),
        createdAt: new Date(),
      };

      const result = await materialsCollection.insertOne(newMaterial);

      if (result.acknowledged) {
        res.status(201).json({ material: newMaterial });
      } else {
        throw new Error("Failed to upload material");
      }
    } catch (err) {
      console.error("Error uploading material:", err);
      res.status(500).json({ error: "Failed to upload material" });
    }
  },

  // Upload material with file (instructor only)
  async uploadMaterialWithFile(req, res) {
    try {
      const materialsCollection = db.getMaterialsCollection();
      const { title, description, courseId } = req.body;
      const file = req.file;

      if (!title || !file) {
        return res.status(400).json({ error: "Title and file are required" });
      }

      // Construct file URL
      const fileUrl = `/uploads/${file.filename}`;

      const newMaterial = {
        _id: new ObjectId(),
        title,
        description: description || "",
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        courseId: courseId || null,
        instructorId: new ObjectId(req.user),
        createdAt: new Date(),
      };

      const result = await materialsCollection.insertOne(newMaterial);

      if (result.acknowledged) {
        res.status(201).json({ material: newMaterial });
      } else {
        throw new Error("Failed to upload material");
      }
    } catch (err) {
      console.error("Error uploading material with file:", err);
      res.status(500).json({ error: "Failed to upload material" });
    }
  },

  // Delete material (instructor only - their own)
  async deleteMaterial(req, res) {
    try {
      const materialsCollection = db.getMaterialsCollection();
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      const result = await materialsCollection.deleteOne({
        _id: new ObjectId(id),
        instructorId: new ObjectId(req.user),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Material not found or unauthorized" });
      }

      res.status(200).json({ message: "Material deleted successfully" });
    } catch (err) {
      console.error("Error deleting material:", err);
      res.status(500).json({ error: "Failed to delete material" });
    }
  },

  // Fix materials without instructor (admin/development only)
  async fixMaterialsWithoutInstructor(req, res) {
    try {
      const materialsCollection = db.getMaterialsCollection();
      const usersCollection = db.getUsersCollection();

      // Find all materials without instructorId or with null instructorId
      const materialsWithoutInstructor = await materialsCollection
        .find({
          $or: [
            { instructorId: null },
            { instructorId: { $exists: false } }
          ]
        })
        .toArray();

      if (materialsWithoutInstructor.length === 0) {
        return res.status(200).json({ 
          message: "No materials need fixing", 
          fixed: 0 
        });
      }

      // Get the current user (instructor) to assign materials to
      const currentUserId = new ObjectId(req.user);
      
      // Update all materials without instructor to the current user
      const result = await materialsCollection.updateMany(
        {
          $or: [
            { instructorId: null },
            { instructorId: { $exists: false } }
          ]
        },
        {
          $set: { instructorId: currentUserId }
        }
      );

      res.status(200).json({ 
        message: "Materials updated successfully",
        fixed: result.modifiedCount 
      });
    } catch (err) {
      console.error("Error fixing materials:", err);
      res.status(500).json({ error: "Failed to fix materials" });
    }
  },
};

module.exports = materialController;
