const express = require("express");
const archiveController = require("../controllers/archiveController");
const { allowRoles, verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/upload",
  verifyToken,
  allowRoles("Administrateur", "Superviseur", "Archiviste"),
  archiveController.uploadDocument,
);

module.exports = router;
