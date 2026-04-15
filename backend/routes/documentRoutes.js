const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const archiveCtrl = require("../controllers/archiveController");

// Tout le monde (connecté) peut voir les documents généraux
router.get("/all", verifyToken, archiveCtrl.getAllDocs);

// Seuls les admins ou les RH peuvent voir les dossiers RH
router.get(
  "/rh",
  verifyToken,
  checkPermission(["ADMIN", "ARCHIVISTE"], "RH"),
  archiveCtrl.getRHDocs,
);

// Seul l'Admin peut supprimer définitivement un document
router.delete(
  "/:id",
  verifyToken,
  checkPermission(["ADMIN"]),
  archiveCtrl.deleteDoc,
);

module.exports = router;
