exports.streamFile = async (req, res) => {
  const doc = await Document.findByPk(req.params.id);

  // Vérification de sécurité finale avant de servir le fichier
  if (
    doc.category === "RH" &&
    req.user.department !== "RH" &&
    req.user.role !== "ADMIN"
  ) {
    return res.status(403).send("Accès non autorisé à ce fichier physique.");
  }

  res.sendFile(path.resolve(doc.filePath));
};
