const express = require("express");
const archiveController = require("../controllers/archiveController");

const router = express.Router();

router.post("/upload", archiveController.uploadDocument);

module.exports = router;
