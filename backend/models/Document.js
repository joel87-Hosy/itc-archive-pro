const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Document = sequelize.define("Document", {
  reference: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  category: {
    type: DataTypes.ENUM(
      "Etude",
      "Gestion Stock ITC",
      "RH",
      "Finance",
      "Supervision ITC",
      "Attachement ITC",
      "Corrdination-Moov ITC",
      "Coordination-Orange ITC",
      "Technique",
      "Commercial",
    ),
    allowNull: false,
  },
  filePath: { type: DataTypes.STRING, allowNull: false },
  fileType: { type: DataTypes.STRING },
  fileSize: { type: DataTypes.INTEGER },
  metadata: { type: DataTypes.JSONB },
  retentionDate: { type: DataTypes.DATE },
});

module.exports = Document;
