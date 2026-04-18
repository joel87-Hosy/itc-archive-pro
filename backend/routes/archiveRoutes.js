const express = require("express");
const archiveController = require("../controllers/archiveController");
const { allowRoles, verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get(
  "/",
  verifyToken,
  allowRoles("Administrateur", "Superviseur", "Archiviste", "Consultation"),
  archiveController.listDocuments,
);

router.post(
  "/upload",
  verifyToken,
  allowRoles("Administrateur", "Superviseur", "Archiviste"),
  upload.single("file"),
  archiveController.uploadDocument,
);

router.delete(
  "/:id",
  verifyToken,
  allowRoles("Administrateur", "Superviseur", "Archiviste"),
  archiveController.deleteDocument,
);

module.exports = router;
