require("dotenv").config();
const express = require("express");
const cors = require("cors");
const archiveRoutes = require("./routes/archiveRoutes");
const userRoutes = require("./routes/userRoutes");
const { initUserStore } = require("./services/userStore");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend ITC Archive en cours d'exécution",
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
