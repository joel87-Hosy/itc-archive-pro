require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const archiveRoutes = require("./routes/archiveRoutes");
const userRoutes = require("./routes/userRoutes");
const { initUserStore } = require("./services/userStore");

const app = express();
const PORT = process.env.PORT || 5000;

const normalizeText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const buildAssistantReply = (message = "", context = {}) => {
  const normalized = normalizeText(message);
  const documentsCount = Number(context.documentsCount || 0);
  const recentDocumentsCount = Number(context.recentDocumentsCount || 0);
  const accountsCount = Number(context.accountsCount || 0);
  const dominantCategory = context.dominantCategory || "Archives générales";
  const role = context.role || "Utilisateur";
  const isOnline = Boolean(context.isOnline);

  if (!normalized.trim()) {
    return "Je peux vous aider à prioriser les archives, améliorer la recherche et conseiller le mode cloud ou mobile.";
  }

  if (normalized.includes("prior") || normalized.includes("urgent")) {
    return `Priorité recommandée : surveiller la catégorie ${dominantCategory}, qui concentre actuellement la plus forte activité documentaire.`;
  }

  if (normalized.includes("mobile") || normalized.includes("terrain")) {
    return "Pour les équipes terrain, l’application peut être utilisée en mode mobile avec continuité locale et synchronisation ultérieure.";
  }

  if (
    normalized.includes("cloud") ||
    normalized.includes("edge") ||
    normalized.includes("sync")
  ) {
    return isOnline
      ? "Le portail est prêt pour une extension cloud sécurisée tout en gardant une continuité edge locale."
      : "Le portail fonctionne actuellement en logique edge locale, adaptée aux coupures réseau et à une future synchronisation cloud.";
  }

  if (
    normalized.includes("recherche") ||
    normalized.includes("search") ||
    normalized.includes("trouver")
  ) {
    return `Conseil de recherche : combinez la catégorie ${dominantCategory} avec une référence ou un mot métier pour obtenir des résultats plus précis.`;
  }

  if (
    normalized.includes("compte") ||
    normalized.includes("utilisateur") ||
    normalized.includes("equipe")
  ) {
    return `${accountsCount} compte(s) sont disponibles. Le rôle actif ${role} peut piloter les accès selon les règles déjà en place.`;
  }

  return `Vue métier : ${documentsCount} document(s) suivis, dont ${recentDocumentsCount} récent(s). La catégorie dominante reste ${dominantCategory}.`;
};

const interpretNaturalSearch = (query = "") => {
  const normalized = normalizeText(query);

  const categoryMap = [
    { keyword: "finance", category: "Finance" },
    { keyword: "rh", category: "RH" },
    { keyword: "ressources humaines", category: "RH" },
    { keyword: "stock", category: "Gestion Stock ITC" },
    { keyword: "supervision", category: "Supervision ITC" },
    { keyword: "moov", category: "Corrdination-Moov ITC" },
    { keyword: "orange", category: "Coordination-Orange ITC" },
    { keyword: "etude", category: "Etude" },
    { keyword: "attachement", category: "Attachement ITC" },
  ];

  const matchedCategory =
    categoryMap.find((item) => normalized.includes(item.keyword))?.category ||
    "Tous";

  const sortOption = normalized.includes("reference")
    ? "reference"
    : normalized.includes("nom") || normalized.includes("titre")
      ? "nom"
      : "date";

  const ignoredWords = new Set([
    "montre",
    "moi",
    "documents",
    "document",
    "archives",
    "archive",
    "des",
    "les",
    "la",
    "le",
    "de",
    "du",
    "en",
    "pour",
    "avec",
    "cette",
    "semaine",
    "recent",
    "recents",
    "priorite",
    "prioriser",
  ]);

  const searchTokens = normalized
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !ignoredWords.has(token));

  const searchTerm = searchTokens[0] || matchedCategory;

  return {
    category: matchedCategory,
    searchTerm: searchTerm === "Tous" ? "" : searchTerm,
    sortOption,
    explanation:
      matchedCategory === "Tous"
        ? `Recherche intelligente appliquée avec le mot-clé ${searchTerm || "général"}.`
        : `Recherche intelligente orientée vers la catégorie ${matchedCategory}.`,
  };
};

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://joel87-hosy.github.io",
  ].filter(Boolean),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez patienter avant de réessayer.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Trop de tentatives de connexion. Veuillez patienter avant de réessayer.",
  },
});

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiLimiter);
app.use("/api/users/login", authLimiter);
app.use(
  "/uploads",
  express.static("uploads", {
    index: false,
    fallthrough: false,
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend ITC Archive en cours d'exécution",
  });
});

app.get("/api/innovation/overview", (req, res) => {
  const deploymentMode = process.env.DATABASE_URL
    ? "cloud-connected"
    : "edge-ready";

  res.status(200).json({
    success: true,
    data: {
      app: "ITC Archive Pro",
      deploymentMode,
      syncStatus:
        deploymentMode === "cloud-connected"
          ? "Synchronisation cloud disponible avec continuité locale."
          : "Mode edge local prêt, avec extension cloud possible.",
      generatedAt: new Date().toISOString(),
      capabilities: [
        {
          id: "agents-genai",
          title: "IA ubiquitaire",
          summary:
            "Des assistants contextuels peuvent enrichir la recherche, le tri et la valorisation documentaire sans perturber le flux existant.",
          status: "Prêt",
        },
        {
          id: "cloud-edge",
          title: "Architectures Cloud & Edge",
          summary:
            "Le portail supporte une exploitation locale robuste avec une ouverture vers la synchronisation cloud sécurisée.",
          status: deploymentMode === "cloud-connected" ? "Connecté" : "Local",
        },
        {
          id: "web-mobile",
          title: "Convergence Web & Mobile",
          summary:
            "L’interface actuelle reste compatible avec une expérience responsive et multi-écrans.",
          status: "Actif",
        },
      ],
    },
  });
});

app.post("/api/innovation/assistant", (req, res) => {
  const { message, context } = req.body || {};

  res.status(200).json({
    success: true,
    data: {
      reply: buildAssistantReply(message, context),
      generatedAt: new Date().toISOString(),
    },
  });
});

app.post("/api/innovation/natural-search", (req, res) => {
  const { query } = req.body || {};

  res.status(200).json({
    success: true,
    data: interpretNaturalSearch(query),
  });
});

app.use("/api/archives", archiveRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable" });
});

const startServer = async () => {
  await initUserStore();

  app.listen(PORT, () => {
    console.log(`Serveur backend démarré sur le port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Erreur au démarrage du serveur:", error.message);
  process.exit(1);
});
