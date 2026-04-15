// backend/controllers/reportController.js
const { Parser } = require("json2csv");
const Document = require("../models/Document");

exports.exportToCSV = async (req, res) => {
  try {
    const docs = await Document.findAll();
    const fields = [
      "reference",
      "title",
      "category",
      "createdAt",
      "retentionDate",
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(docs);

    res.header("Content-Type", "text/csv");
    res.attachment(
      `Rapport_Archives_ITC_${new Date().toISOString().split("T")[0]}.csv`,
    );
    return res.send(csv);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Erreur lors de la génération du rapport" });
  }
};
