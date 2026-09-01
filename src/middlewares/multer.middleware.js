import multer from "multer";

// Keep uploaded files in memory so controllers can upload
// req.file.buffer directly to Cloudinary.
const storage = multer.memoryStorage();

// Keep the folderName argument for compatibility with existing routes
// such as upload("profile").single("profile_photo").
export const upload = (folderName = "default") => {
  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });
};
