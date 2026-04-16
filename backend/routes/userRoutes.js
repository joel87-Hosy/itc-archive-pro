const express = require("express");
const userController = require("../controllers/userController");
const { allowRoles, verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/login", userController.loginUser);
router.get(
  "/",
  verifyToken,
  allowRoles("Administrateur", "Superviseur", "Archiviste"),
  userController.getUsers,
);
router.post(
  "/",
  verifyToken,
  allowRoles("Administrateur"),
  userController.createUser,
);
router.put(
  "/:id",
  verifyToken,
  allowRoles("Administrateur", "Superviseur"),
  userController.updateUser,
);
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Administrateur", "Superviseur"),
  userController.deleteUser,
);

module.exports = router;
