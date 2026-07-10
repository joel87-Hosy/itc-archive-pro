/**
 * Upload proxy route.
 * The backend receives the file, sends it to Firebase Storage, and returns a download URL.
 */

const express = require("express");
const multer = require("multer");
const { randomUUID } = require("crypto");

const router = express.Router();

let admin;
let storage;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || "archive-itc.appspot.com";

try {
  admin = require("firebase-admin");

  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require("./firebase-service-account.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
    });
  }

  storage = admin.storage();
} catch (error) {
  console.warn("Firebase Admin SDK is not configured. Upload endpoint will not work.");
  console.warn("Set FIREBASE_SERVICE_ACCOUNT env var or create firebase-service-account.json.");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".py"];
    const ext = require("path").extname(file.originalname).toLowerCase();

    if (blockedExtensions.includes(ext)) {
      return cb(new Error("Type de fichier non autorise"));
    }

    cb(null, true);
  },
});

const runWithTimeout = (promise, timeoutMs, message) => {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    const isSizeError = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";

    return res.status(isSizeError ? 413 : 400).json({
      success: false,
      error: isSizeError
        ? "Fichier trop volumineux (max 100MB)"
        : error.message || "Fichier invalide",
    });
  });
};

const buildFirebaseDownloadUrl = (bucketName, storagePath, token) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;

router.post("/upload", uploadSingleFile, async (req, res) => {
  try {
    if (!storage) {
      return res.status(503).json({
        success: false,
        error: "Firebase Storage non configure sur le serveur",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier fourni",
      });
    }

    const { title, category, reference } = req.body;
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: "Title et category sont requis",
      });
    }

    const timestamp = Date.now();
    const storagePath = `archives/${timestamp}_${req.file.originalname}`;
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const downloadToken = randomUUID();

    await runWithTimeout(
      file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          metadata: {
            title,
            category,
            reference: reference || `ITC-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`,
            uploadedAt: new Date().toISOString(),
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
        resumable: false,
      }),
      120000,
      "Le televersement vers Firebase a pris trop de temps. Veuillez reessayer."
    );

    const downloadUrl = buildFirebaseDownloadUrl(bucket.name, storagePath, downloadToken);

    return res.status(200).json({
      success: true,
      fileUrl: downloadUrl,
      fileName: req.file.originalname,
      storagePath,
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erreur lors de l'upload",
    });
  }
});

module.exports = router;
