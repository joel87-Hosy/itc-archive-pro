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
