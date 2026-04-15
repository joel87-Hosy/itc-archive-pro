const Document = require("../models/Document");

exports.uploadDocument = async (req, res) => {
  try {
    const { title, category, reference, retentionYears } = req.body;
    const file = req.file;

    const retentionDate = new Date();
    retentionDate.setFullYear(
      retentionDate.getFullYear() + parseInt(retentionYears, 10),
    );

    const newDoc = await Document.create({
      reference,
      title,
      category,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      retentionDate,
    });

    res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
