const SECURE_ACCOUNTS_KEY = "itc_accounts_secure_store";
const APP_AUTH_SALT = "itc-archive-pro";

const DEFAULT_HOSTED_ACCOUNTS = [
  {
    id: 1,
    name: "Admin ITC",
    email: "admin@itc.ci",
    passwordHash:
      "680b602c47d8346de27de5302f59daaebc982150884ee3236011dc0ae66ce021",
    role: "Administrateur",
    department: "Système",
  },
  {
    id: 2,
    name: "koffi herve",
    email: "archiviste@itc.ci",
    passwordHash:
      "b8f20efda10a33c43c5ff60c26c3992cb0f685066e65699ba2dcb23eb34b91b0",
    role: "Archiviste",
    department: "Département Technique",
  },
  {
    id: 4,
    name: "superviseur",
    email: "superviseur@itc.ci",
    passwordHash:
      "e7cbb319b3093772cf4ae6081fabc4e734701a6183297b58b3ecdda4780c74a7",
    role: "Superviseur",
    department: "Département Technique",
  },
];

const HOSTED_ADMIN_ACCOUNT = DEFAULT_HOSTED_ACCOUNTS[0];

const stripSecret = (account = {}) => {
  const { passwordHash, ...safeAccount } = account;
  return safeAccount;
};

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const buildPasswordHash = async (email = "", password = "") => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const payload = `${normalizedEmail}:${normalizedPassword}:${APP_AUTH_SALT}`;
  const encodedPayload = new TextEncoder().encode(payload);
  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    encodedPayload,
  );

  return toHex(hashBuffer);
};

const readStoredAccounts = () => {
  try {
    const storedValue = localStorage.getItem(SECURE_ACCOUNTS_KEY) || "[]";
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const writeStoredAccounts = (accounts = []) => {
  localStorage.setItem(SECURE_ACCOUNTS_KEY, JSON.stringify(accounts));
  return accounts;
};

const normalizeStoredAccounts = async (accounts = []) => {
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const accountsByEmail = new Map(
    safeAccounts
      .filter((account) => account?.email)
      .map((account) => [account.email.toLowerCase(), account]),
  );

  let shouldPersist = false;

  for (const defaultAccount of DEFAULT_HOSTED_ACCOUNTS) {
    const normalizedEmail = defaultAccount.email.toLowerCase();

    if (!accountsByEmail.has(normalizedEmail)) {
      accountsByEmail.set(normalizedEmail, defaultAccount);
      shouldPersist = true;
    }
  }

  const normalizedAccounts = [];

  for (const account of accountsByEmail.values()) {
    if (!account?.email) {
      continue;
    }

    const normalizedEmail = account.email.toLowerCase();
    const matchingDefaultAccount = DEFAULT_HOSTED_ACCOUNTS.find(
      (defaultAccount) => defaultAccount.email === normalizedEmail,
    );

    if (account.passwordHash) {
      normalizedAccounts.push({
        ...account,
        email: normalizedEmail,
      });
      continue;
    }

    if (account.password) {
      normalizedAccounts.push({
        ...account,
        email: normalizedEmail,
        passwordHash: await buildPasswordHash(
          normalizedEmail,
          account.password,
        ),
      });
      shouldPersist = true;
      continue;
    }

    if (matchingDefaultAccount) {
      normalizedAccounts.push(matchingDefaultAccount);
      shouldPersist = true;
    }
  }

  if (shouldPersist) {
    writeStoredAccounts(normalizedAccounts);
  }

  return normalizedAccounts;
};

export const getHostedAccounts = async () => {
  const normalizedAccounts =
    await normalizeStoredAccounts(readStoredAccounts());

  return normalizedAccounts
    .map(stripSecret)
    .sort((firstAccount, secondAccount) =>
      String(firstAccount.name || "").localeCompare(
        String(secondAccount.name || ""),
        "fr",
        { sensitivity: "base" },
      ),
    );
};

export const authenticateHostedUser = async (email = "", password = "") => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Veuillez renseigner votre email et votre mot de passe.");
  }

  const normalizedAccounts =
    await normalizeStoredAccounts(readStoredAccounts());
  const matchedAccount = normalizedAccounts.find(
    (account) => account.email?.toLowerCase() === normalizedEmail,
  );

  if (!matchedAccount) {
    throw new Error("Email ou mot de passe incorrect.");
  }

  const submittedPasswordHash = await buildPasswordHash(
    normalizedEmail,
    normalizedPassword,
  );

  if (matchedAccount.passwordHash !== submittedPasswordHash) {
    throw new Error("Email ou mot de passe incorrect.");
  }

  return stripSecret(matchedAccount);
};

export const createHostedAccount = async (payload = {}) => {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const role = payload.role?.trim();
  const department = payload.department?.trim() || "Département Technique";

  if (!name || !email || !password || !role) {
    throw new Error(
      "Veuillez renseigner le nom, l'email, le mot de passe et le rôle.",
    );
  }

  const normalizedAccounts =
    await normalizeStoredAccounts(readStoredAccounts());

  if (
    normalizedAccounts.some(
      (account) => account.email?.toLowerCase() === email.toLowerCase(),
    )
  ) {
    throw new Error("Un compte avec cet email existe déjà.");
  }

  const newAccount = {
    id: Date.now(),
    name,
    email,
    passwordHash: await buildPasswordHash(email, password),
    role,
    department,
  };

  writeStoredAccounts([...normalizedAccounts, newAccount]);
  return stripSecret(newAccount);
};

export const updateHostedAccount = async (id, payload = {}) => {
  const normalizedId = Number(id);
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const role = payload.role?.trim();
  const department = payload.department?.trim() || "Département Technique";

  if (!name || !email || !role) {
    throw new Error("Veuillez renseigner le nom, l'email et le rôle.");
  }

  const normalizedAccounts =
    await normalizeStoredAccounts(readStoredAccounts());
  const accountIndex = normalizedAccounts.findIndex(
    (account) => Number(account.id) === normalizedId,
  );

  if (accountIndex === -1) {
    throw new Error("Compte introuvable.");
  }

  const duplicateAccount = normalizedAccounts.find(
    (account) =>
      account.email?.toLowerCase() === email &&
      Number(account.id) !== normalizedId,
  );

  if (duplicateAccount) {
    throw new Error("Un compte avec cet email existe déjà.");
  }

  const currentAccount = normalizedAccounts[accountIndex];
  const updatedAccount = {
    ...currentAccount,
    name,
    email,
    role,
    department,
    passwordHash: password
      ? await buildPasswordHash(email, password)
      : currentAccount.passwordHash,
  };

  normalizedAccounts[accountIndex] = updatedAccount;
  writeStoredAccounts(normalizedAccounts);
  return stripSecret(updatedAccount);
};

export const deleteHostedAccount = async (id) => {
  const normalizedId = Number(id);
  const normalizedAccounts =
    await normalizeStoredAccounts(readStoredAccounts());
  const targetAccount = normalizedAccounts.find(
    (account) => Number(account.id) === normalizedId,
  );

  if (!targetAccount) {
    throw new Error("Compte introuvable.");
  }

  if (targetAccount.email?.toLowerCase() === HOSTED_ADMIN_ACCOUNT.email) {
    throw new Error(
      "Le compte administrateur principal ne peut pas être supprimé.",
    );
  }

  writeStoredAccounts(
    normalizedAccounts.filter((account) => Number(account.id) !== normalizedId),
  );
};
