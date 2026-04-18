const Document = require("../models/Document");
const fs = require("fs");
const path = require("path");

exports.listDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      order: [["createdAt", "DESC"]],
    });

    const data = documents.map((document) => {
      const plainDocument = document.get({ plain: true });
      const filePath = plainDocument.filePath || "";
      const fileName = filePath ? path.basename(filePath) : `${plainDocument.title}.pdf`;

      return {
        id: plainDocument.id,
        reference: plainDocument.reference,
        title: plainDocument.title,
        category: plainDocument.category,
        fileName,
        filePath,
        registeredAt: plainDocument.createdAt
          ? new Date(plainDocument.createdAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        uploadedAt: plainDocument.createdAt || new Date().toISOString(),
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des documents.",
    });
  }
};

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

    const normalizedRetentionYears = retentionYears
      ? Number.parseInt(retentionYears, 10)
      : 5;

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

    res.status(201).json({
      success: true,
      data: {
        id: newDoc.id,
        reference: newDoc.reference,
        title: newDoc.title,
        category: newDoc.category,
        fileName: file.originalname,
        filePath: newDoc.filePath,
        registeredAt: newDoc.createdAt
          ? new Date(newDoc.createdAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        uploadedAt: newDoc.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du document.",
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const documentId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(documentId) || documentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de document invalide.",
      });
    }

    const document = await Document.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document introuvable.",
      });
    }

    const filePath = document.filePath;

    await document.destroy();

    if (filePath) {
      const absolutePath = path.resolve(filePath);

      fs.promises.unlink(absolutePath).catch((error) => {
        if (error.code !== "ENOENT") {
          console.error("Erreur suppression fichier:", error.message);
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document supprimé définitivement.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du document.",
    });
  }
};
