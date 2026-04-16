const crypto = require("crypto");
const userStore = require("../services/userStore");

exports.loginUser = async (req, res) => {
  try {
    const user = await userStore.authenticateUser(
      req.body.email,
      req.body.password,
    );

    const token = crypto.randomBytes(24).toString("hex");

    res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user,
      storage: userStore.getStorageMode(),
    });
  } catch (error) {
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
