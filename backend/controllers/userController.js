const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");
const userStore = require("../services/userStore");

const failedLoginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const buildAttemptKey = (req) => {
  const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  return `${ipAddress}:${email}`;
};

const resetExpiredAttempts = () => {
  const now = Date.now();

  for (const [key, value] of failedLoginAttempts.entries()) {
    if (now - value.firstAttemptAt > LOGIN_WINDOW_MS) {
      failedLoginAttempts.delete(key);
    }
  }
};

const registerFailedAttempt = (attemptKey) => {
  const existingAttempt = failedLoginAttempts.get(attemptKey);

  if (!existingAttempt) {
    failedLoginAttempts.set(attemptKey, {
      count: 1,
      firstAttemptAt: Date.now(),
    });
    return;
  }

  existingAttempt.count += 1;
};

exports.loginUser = async (req, res) => {
  resetExpiredAttempts();
  const attemptKey = buildAttemptKey(req);
  const activeAttempt = failedLoginAttempts.get(attemptKey);

  if (activeAttempt && activeAttempt.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message:
        "Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.",
    });
  }

  try {
    const user = await userStore.authenticateUser(
      req.body.email,
      req.body.password,
    );

    failedLoginAttempts.delete(attemptKey);

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: "12h" },
    );

    res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user,
      storage: userStore.getStorageMode(),
    });
  } catch (error) {
    if ((error.status || 500) === 401) {
      registerFailedAttempt(attemptKey);
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Connexion impossible.",
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await userStore.listUsers();
    res.status(200).json({
      success: true,
      data: users,
      storage: userStore.getStorageMode(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Impossible de récupérer les comptes.",
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userStore.createUser(req.body);
    res.status(201).json({
      success: true,
      message: "Le compte a été créé avec succès.",
      data: user,
      storage: userStore.getStorageMode(),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Création du compte impossible.",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userStore.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Le compte a été mis à jour avec succès.",
      data: user,
      storage: userStore.getStorageMode(),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Mise à jour du compte impossible.",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userStore.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: "Le compte a été supprimé avec succès.",
      storage: userStore.getStorageMode(),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Suppression du compte impossible.",
    });
  }
};
