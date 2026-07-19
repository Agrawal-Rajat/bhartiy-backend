// utils/ResetFolder.js
import fs from "fs/promises";
import path from "path";

export default async function ResetFolder(baseDir, folderName, imagearr) {
  const folderPath = path.join(baseDir, folderName);

  try {
    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true });

    // Convert imagearr to only filenames (handles URLs too)
    const validFiles = (imagearr || [])
      .filter(Boolean)
      .map((img) => path.basename(img));

    // Read all files in the folder
    const files = await fs.readdir(folderPath);

    // Delete files that are NOT in validFiles
    await Promise.all(
      files.map(async (file) => {
        if (!validFiles.includes(file)) {
          const filePath = path.join(folderPath, file);
          try {
            const stat = await fs.lstat(filePath);
            if (stat.isFile()) {
              await fs.unlink(filePath);
              console.log(`🗑️ Removed unused file: ${filePath}`);
            }
          } catch (err) {
            if (err.code === "ENOENT") {
              // File already doesn't exist, skip
              console.warn(`⚠️ File not found, skipping: ${filePath}`);
            } else {
              throw err;
            }
          }
        }
      })
    );

    console.log(`✅ Folder cleaned: ${folderPath}`);
  } catch (error) {
    console.error("Error in ResetFolder:", error);
    throw error;
  }
}
