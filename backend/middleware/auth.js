const jwt = require("jsonwebtoken");

// Vérifie si l'utilisateur est connecté
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token)
    return res
      .status(403)
      .json({ message: "Accès refusé. Aucun jeton fourni." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contient id, role, et département
    next();
  } catch (error) {
    res.status(401).json({ message: "Jeton invalide." });
  }
};

// Vérifie les permissions spécifiques au dossier/département
exports.checkPermission = (allowedRoles, allowedDept = null) => {
  return (req, res, next) => {
    // L'Admin a accès à tout
    if (req.user.role === "ADMIN") return next();

    // Vérification du rôle (ex: ARCHIVISTE, LECTEUR)
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Niveau d'accès insuffisant." });
    }

    // Restriction par département (Optionnel)
    if (allowedDept && req.user.department !== allowedDept) {
      return res
        .status(403)
        .json({ message: `Accès restreint au département ${allowedDept}.` });
    }

    next();
  };
};
