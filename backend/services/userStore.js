const fs = require("fs/promises");
const path = require("path");
const sequelize = require("../config/db");
const User = require("../models/User");

const DATA_FILE = path.join(__dirname, "..", "data", "users.json");

const DEFAULT_USERS = [
  {
    id: 1,
    name: "Admin ITC",
    email: "admin@itc.ci",
    password: "admin123",
    role: "Administrateur",
    department: "Système",
  },
  {
    id: 2,
    name: "Archive ITC",
    email: "archives@itc.ci",
    password: "archive123",
    role: "Archiviste",
    department: "Archives",
  },
  {
    id: 3,
    name: "Consult ITC",
    email: "consultation@itc.ci",
    password: "consult123",
    role: "Consultation",
    department: "Consultation",
  },
];

let storageMode = "file";

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
  return Array.isArray(users) ? users : [];
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
      await User.bulkCreate(DEFAULT_USERS.map(({ id, ...user }) => user));
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
  const password = payload.password?.trim() || "changeme123";
  const role = payload.role?.trim();
  const department = payload.department?.trim() || null;

  if (!name || !email || !role) {
    throw buildError("Veuillez renseigner le nom, l'email et le rôle.");
  }

  if (storageMode === "database") {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw buildError("Un compte avec cet email existe déjà.", 409);
    }

    const user = await User.create({ name, email, password, role, department });
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
    password,
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

  if (!name || !email || !role) {
    throw buildError("Veuillez renseigner le nom, l'email et le rôle.");
  }

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
      ...(password ? { password } : {}),
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
    ...(password ? { password } : {}),
  };

  await writeUsersToFile(users);
  return sanitizeUser(users[userIndex]);
}

async function deleteUser(id) {
  const normalizedId = Number(id);

  if (storageMode === "database") {
    const deletedCount = await User.destroy({ where: { id: normalizedId } });
    if (!deletedCount) {
      throw buildError("Compte introuvable.", 404);
    }
    return;
  }

  const users = await readUsersFromFile();
  const filteredUsers = users.filter(
    (user) => Number(user.id) !== normalizedId,
  );

  if (filteredUsers.length === users.length) {
    throw buildError("Compte introuvable.", 404);
  }

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
  deleteUser,
  getStorageMode,
};
