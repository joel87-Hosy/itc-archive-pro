/**
 * Upload proxy route.
 * The backend receives the file, sends it to Supabase Storage, and returns a public URL.
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || "archives";

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

if (!supabase) {
  console.warn("Supabase Storage is not configured. Upload endpoint will not work.");
  console.warn("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".py"];
    const ext = path.extname(file.originalname).toLowerCase();

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
        ? "Fichier trop volumineux (max 50MB sur Supabase gratuit)"
        : error.message || "Fichier invalide",
    });
  });
};

const sanitizeFileName = (fileName = "document") =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "document";

const uploadToSupabase = async (storagePath, file) => {
  const { error } = await supabase.storage
    .from(supabaseBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(storagePath);
  return data.publicUrl;
};

router.post("/upload", uploadSingleFile, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: "Supabase Storage non configure sur le serveur",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier fourni",
      });
    }

    const { title, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: "Title et category sont requis",
      });
    }

    const timestamp = Date.now();
    const storagePath = `archives/${timestamp}_${sanitizeFileName(req.file.originalname)}`;

    const fileUrl = await runWithTimeout(
      uploadToSupabase(storagePath, req.file),
      120000,
      "Le televersement vers Supabase a pris trop de temps. Veuillez reessayer."
    );

    return res.status(200).json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      storagePath,
      storageProvider: "supabase",
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erreur lors de l'upload",
    });
  }
});

router.delete("/upload", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: "Supabase Storage non configure sur le serveur",
      });
    }

    const { storagePath } = req.body || {};
    if (!storagePath) {
      return res.status(400).json({
        success: false,
        error: "storagePath est requis",
      });
    }

    const { error } = await supabase.storage.from(supabaseBucket).remove([storagePath]);
    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur suppression Supabase:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erreur lors de la suppression du fichier",
    });
  }
});

module.exports = router;
