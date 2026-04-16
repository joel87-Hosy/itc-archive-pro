const Document = require("../models/Document");

exports.uploadDocument = async (req, res) => {
  try {
    const { title, category, reference, retentionYears } = req.body;
    const file = req.file;

    if (!title?.trim() || !category?.trim() || !reference?.trim() || !file) {
      return res.status(400).json({
        success: false,
        message:
          "Le titre, la catégorie, la référence et le fichier sont requis.",
      });
    }

    const normalizedRetentionYears = Number.parseInt(retentionYears, 10);

    if (
      !Number.isInteger(normalizedRetentionYears) ||
      normalizedRetentionYears < 1 ||
      normalizedRetentionYears > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "La durée de rétention doit être comprise entre 1 et 30 ans.",
      });
    }

    const retentionDate = new Date();
    retentionDate.setFullYear(
      retentionDate.getFullYear() + normalizedRetentionYears,
    );

    const newDoc = await Document.create({
      reference: reference.trim(),
      title: title.trim(),
      category: category.trim(),
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      retentionDate,
    });

    res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du document.",
    });
  }
};
