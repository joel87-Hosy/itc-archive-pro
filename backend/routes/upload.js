/**
 * Route d'upload proxy - Contourne les problèmes CORS en faisant l'upload côté serveur
 * Backend reçoit le fichier → Firebase Storage → Retourne URL
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");

// Importer les services Firebase
let admin;
let storage;

try {
  // Firebase Admin SDK - initialiser depuis le backend
  admin = require("firebase-admin");
  
  // Vérifier si déjà initialisé
  if (!admin.apps.length) {
    // Charger les credentials depuis la variable d'env ou un fichier
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require("./firebase-service-account.json"); // Chemin local pour développement

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "archive-itc.appspot.com",
    });
  }

  storage = admin.storage();
} catch (error) {
  console.warn("⚠️ Firebase Admin SDK not configured. Upload endpoint will not work.");
  console.warn("Set FIREBASE_SERVICE_ACCOUNT env var or create firebase-service-account.json");
}

// Configurare multer pour les uploads en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter la plupart des fichiers, refuser les exécutables
    const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".py"];
    const ext = require("path").extname(file.originalname).toLowerCase();
    
    if (blockedExtensions.includes(ext)) {
      return cb(new Error("Type de fichier non autorisé"));
    }
    
    cb(null, true);
  },
});

/**
 * POST /api/upload
 * Upload un fichier vers Firebase Storage
 * 
 * Body (multipart/form-data):
 * - file: Binary (le fichier)
 * - title: string (titre du document)
 * - category: string (catégorie)
 * - reference: string (référence, optionnel)
 * 
 * Response:
 * {
 *   success: true,
 *   fileUrl: "https://firebasestorage.googleapis.com/...",
 *   fileName: "document.pdf",
 *   storagePath: "archives/1234567_document.pdf"
 * }
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Vérifier Firebase est initialisé
    if (!storage) {
      return res.status(503).json({
        success: false,
        error: "Firebase Storage non configuré sur le serveur",
      });
    }

    // Vérifier le fichier
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier fourni",
      });
    }

    // Vérifier les données
    const { title, category, reference } = req.body;
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: "Title et category sont requis",
      });
    }

    // Construire le chemin du fichier
    const timestamp = Date.now();
    const storagePath = `archives/${timestamp}_${req.file.originalname}`;
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);

    // Upload le fichier
    await file.save(req.file.buffer, {
      contentType: req.file.mimetype,
      metadata: {
        title,
        category,
        reference: reference || `ITC-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Obtenir l'URL téléchargeable
    const [downloadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 ans
    });

    // Retourner succès
    res.status(200).json({
      success: true,
      fileUrl: downloadUrl,
      fileName: req.file.originalname,
      storagePath,
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erreur lors de l'upload",
    });
  }
});

module.exports = router;
