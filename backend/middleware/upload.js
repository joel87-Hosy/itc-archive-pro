const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadsDirectory = path.resolve(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (req, file, callback) => {
    const safeName = file.originalname
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    callback(null, `${Date.now()}_${safeName || "document.pdf"}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = upload;
