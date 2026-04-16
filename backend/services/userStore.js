const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const sequelize = require("../config/db");
const User = require("../models/User");

const DATA_FILE = path.join(__dirname, "..", "data", "users.json");
const DEFAULT_ADMIN_USER = {
  id: 1,
  name: "Admin ITC",
  email: "admin@itc.ci",
  password:
    "scrypt$f974b6231d4e04e872eb40aaf740255f$77611bb3aa01335cf782a37197c427d606de2d0c0ab7bef6270ed0cfcc74cb3486ea9eb2b55727d11a4693b1ad15c714270d476e5ef2dc32698f89243d6cab94",
  role: "Administrateur",
  department: "Système",
};
const DEFAULT_USERS = [DEFAULT_ADMIN_USER];

let storageMode = "file";

const ALLOWED_ROLES = new Set([
  "Administrateur",
  "Archiviste",
  "Consultation",
  "Superviseur",
]);

const isHashedPassword = (value = "") =>
  typeof value === "string" && value.startsWith("scrypt$");

const hashPassword = (plainPassword = "changeme123") => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
};

const verifyPassword = (plainPassword = "", storedPassword = "") => {
  if (!plainPassword || !storedPassword) {
    return false;
  }

  if (!isHashedPassword(storedPassword)) {
    return plainPassword === storedPassword;
  }

  const [, salt, expectedHash] = storedPassword.split("$");
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, "hex"),
    Buffer.from(derivedKey, "hex"),
  );
};

const normalizePassword = (value) =>
  isHashedPassword(value) ? value : hashPassword(value || "changeme123");

const sanitizeUser = (user) => {
  const plainUser = typeof user?.toJSON === "function" ? user.toJSON() : user;
  const { password, ...safeUser } = plainUser;
  return safeUser;
};

const buildError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateUserPayload = ({
  name,
  email,
  password,
  role,
  requirePassword = false,
}) => {
  if (!name || name.length < 3 || name.length > 80) {
    throw buildError("Le nom doit contenir entre 3 et 80 caractères.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw buildError("Veuillez fournir une adresse email valide.");
  }

  if (!role || !ALLOWED_ROLES.has(role)) {
    throw buildError("Le rôle utilisateur fourni est invalide.");
  }

  if (requirePassword && (!password || password.length < 8)) {
    throw buildError("Le mot de passe doit contenir au moins 8 caractères.");
  }
};

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(DEFAULT_USERS, null, 2),
      "utf8",
    );
  }
}

async function readUsersFromFile() {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, "utf8");
  const users = JSON.parse(content || "[]");
  const safeUsers = Array.isArray(users) ? users : [];
  const hasAdminUser = safeUsers.some(
    (user) => user.email?.toLowerCase() === DEFAULT_ADMIN_USER.email,
  );
  const sourceUsers = hasAdminUser
    ? safeUsers
    : [DEFAULT_ADMIN_USER, ...safeUsers];

  const normalizedUsers = sourceUsers.map((user) => ({
    ...user,
    password: normalizePassword(user.password),
  }));

  const shouldPersistNormalizedUsers =
    !hasAdminUser ||
    normalizedUsers.some(
      (user, index) => user.password !== sourceUsers[index]?.password,
    );

  if (shouldPersistNormalizedUsers) {
    await writeUsersToFile(normalizedUsers);
  }

  return normalizedUsers;
}

async function writeUsersToFile(users) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
}

async function initUserStore() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    storageMode = "database";

    const userCount = await User.count();
    if (userCount === 0) {
      const existingFileUsers = await readUsersFromFile();
      const seedUsers =
        existingFileUsers.length > 0 ? existingFileUsers : DEFAULT_USERS;

      if (seedUsers.length > 0) {
        await User.bulkCreate(
          seedUsers.map(({ id, ...user }) => ({
            ...user,
            password: normalizePassword(user.password),
          })),
        );
      }
    }

    const users = await User.findAll();
    const hasAdminUser = users.some(
      (user) => user.email?.toLowerCase() === DEFAULT_ADMIN_USER.email,
    );

    if (!hasAdminUser) {
      await User.create({
        name: DEFAULT_ADMIN_USER.name,
        email: DEFAULT_ADMIN_USER.email,
        password: normalizePassword(DEFAULT_ADMIN_USER.password),
        role: DEFAULT_ADMIN_USER.role,
        department: DEFAULT_ADMIN_USER.department,
      });
    }

    for (const user of users) {
      if (!isHashedPassword(user.password || "")) {
        await user.update({ password: normalizePassword(user.password) });
      }
    }

    console.log("Gestion des comptes reliée à la base de données.");
  } catch (error) {
    storageMode = "file";
    await ensureDataFile();
    console.warn(
      "Base de données indisponible pour les comptes, utilisation du stockage local.",
    );
  }

  return storageMode;
}

async function listUsers() {
  if (storageMode === "database") {
    const users = await User.findAll({ order: [["id", "ASC"]] });
    return users.map(sanitizeUser);
  }

  const users = await readUsersFromFile();
  return users.map(sanitizeUser);
}

async function createUser(payload) {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const role = payload.role?.trim();
  const department = payload.department?.trim() || null;

  validateUserPayload({
    name,
    email,
    password,
    role,
    requirePassword: true,
  });

  if (storageMode === "database") {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw buildError("Un compte avec cet email existe déjà.", 409);
    }

    const user = await User.create({
      name,
      email,
      password: hashPassword(password),
      role,
      department,
    });
    return sanitizeUser(user);
  }

  const users = await readUsersFromFile();
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw buildError("Un compte avec cet email existe déjà.", 409);
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password: hashPassword(password),
    role,
    department,
  };

  users.push(newUser);
  await writeUsersToFile(users);
  return sanitizeUser(newUser);
}

async function updateUser(id, payload) {
  const normalizedId = Number(id);
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const role = payload.role?.trim();
  const password = payload.password?.trim();
  const department = payload.department?.trim() || null;

  validateUserPayload({
    name,
    email,
    password,
    role,
    requirePassword: false,
  });

  if (storageMode === "database") {
    const user = await User.findByPk(normalizedId);
    if (!user) {
      throw buildError("Compte introuvable.", 404);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.id !== normalizedId) {
      throw buildError("Un compte avec cet email existe déjà.", 409);
    }

    await user.update({
      name,
      email,
      role,
      department,
      ...(password ? { password: hashPassword(password) } : {}),
    });

    return sanitizeUser(user);
  }

  const users = await readUsersFromFile();
  const userIndex = users.findIndex((user) => Number(user.id) === normalizedId);

  if (userIndex === -1) {
    throw buildError("Compte introuvable.", 404);
  }

  const duplicateUser = users.find(
    (user) =>
      user.email.toLowerCase() === email && Number(user.id) !== normalizedId,
  );
  if (duplicateUser) {
    throw buildError("Un compte avec cet email existe déjà.", 409);
  }

  users[userIndex] = {
    ...users[userIndex],
    name,
    email,
    role,
    department,
    ...(password ? { password: hashPassword(password) } : {}),
  };

  await writeUsersToFile(users);
  return sanitizeUser(users[userIndex]);
}

async function authenticateUser(email, password) {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = password?.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw buildError("Veuillez renseigner votre email et votre mot de passe.");
  }

  if (storageMode === "database") {
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user || !verifyPassword(normalizedPassword, user.password || "")) {
      throw buildError("Email ou mot de passe incorrect.", 401);
    }

    if (!isHashedPassword(user.password || "")) {
      await user.update({ password: hashPassword(normalizedPassword) });
    }

    return sanitizeUser(user);
  }

  const users = await readUsersFromFile();
  const user = users.find(
    (item) => item.email?.toLowerCase() === normalizedEmail,
  );

  if (!user || !verifyPassword(normalizedPassword, user.password || "")) {
    throw buildError("Email ou mot de passe incorrect.", 401);
  }

  return sanitizeUser(user);
}

async function deleteUser(id) {
  const normalizedId = Number(id);

  if (storageMode === "database") {
    const user = await User.findByPk(normalizedId);

    if (!user) {
      throw buildError("Compte introuvable.", 404);
    }

    if (user.email?.toLowerCase() === DEFAULT_ADMIN_USER.email) {
      throw buildError(
        "Le compte administrateur principal ne peut pas être supprimé.",
        403,
      );
    }

    if (user.role === "Administrateur") {
      const adminCount = await User.count({
        where: { role: "Administrateur" },
      });

      if (adminCount <= 1) {
        throw buildError(
          "Au moins un administrateur doit toujours rester actif.",
          403,
        );
      }
    }

    await user.destroy();
    return;
  }

  const users = await readUsersFromFile();
  const targetUser = users.find((user) => Number(user.id) === normalizedId);

  if (!targetUser) {
    throw buildError("Compte introuvable.", 404);
  }

  if (targetUser.email?.toLowerCase() === DEFAULT_ADMIN_USER.email) {
    throw buildError(
      "Le compte administrateur principal ne peut pas être supprimé.",
      403,
    );
  }

  const adminCount = users.filter(
    (user) => user.role === "Administrateur",
  ).length;

  if (targetUser.role === "Administrateur" && adminCount <= 1) {
    throw buildError(
      "Au moins un administrateur doit toujours rester actif.",
      403,
    );
  }

  const filteredUsers = users.filter(
    (user) => Number(user.id) !== normalizedId,
  );

  await writeUsersToFile(filteredUsers);
}

function getStorageMode() {
  return storageMode;
}

module.exports = {
  initUserStore,
  listUsers,
  createUser,
  updateUser,
  authenticateUser,
  deleteUser,
  getStorageMode,
};
