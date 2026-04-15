// backend/controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    // 3. Générer le token JWT (Expire dans 24h)
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(200).json({
      success: true,
      token: token,
      user: {
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};
