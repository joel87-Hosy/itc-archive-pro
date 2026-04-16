const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "itc-archive-change-this-secret-in-production";

const normalizeRole = (role = "") => role.trim().toLowerCase();

exports.JWT_SECRET = JWT_SECRET;

exports.verifyToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization || "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Accès refusé. Session manquante.",
    });
  }

  const token = authorizationHeader.slice(7).trim();

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session invalide ou expirée.",
    });
  }
};

exports.allowRoles = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    normalizeRole(role),
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    if (
      normalizedAllowedRoles.length > 0 &&
      !normalizedAllowedRoles.includes(normalizeRole(req.user.role))
    ) {
      return res.status(403).json({
        success: false,
        message: "Niveau d'accès insuffisant.",
      });
    }

    next();
  };
};

exports.checkPermission = (allowedRoles = [], allowedDept = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const currentRole = normalizeRole(req.user.role);
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      normalizeRole(role),
    );

    if (
      normalizedAllowedRoles.length > 0 &&
      !normalizedAllowedRoles.includes(currentRole)
    ) {
      return res.status(403).json({
        success: false,
        message: "Niveau d'accès insuffisant.",
      });
    }

    if (allowedDept && req.user.department !== allowedDept) {
      return res.status(403).json({
        success: false,
        message: `Accès restreint au département ${allowedDept}.`,
      });
    }

    next();
  };
};
