const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // For PDFs and documents, we'll upload as 'image' type with pdf format
    // This is a workaround if 'raw' delivery is blocked
    const isPDF = file.mimetype === "application/pdf";
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    
    // Extract file extension
    const extension = file.originalname.split('.').pop().toLowerCase();
    
    return {
      folder: "edu-genius-materials",
      // Use 'image' for PDFs as workaround, otherwise use proper type
      resource_type: isPDF ? "image" : (isImage ? "image" : isVideo ? "video" : "raw"),
      format: extension,
      public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}`,
      access_mode: "public", // Explicitly set to public
      type: "upload",
      invalidate: true, // Invalidate cached versions
    };
  },
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

module.exports = upload;
