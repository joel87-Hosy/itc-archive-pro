const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Document = sequelize.define("Document", {
  reference: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  category: {
    type: DataTypes.ENUM("RH", "Technique", "Finance", "Commercial"),
    allowNull: false,
  },
  filePath: { type: DataTypes.STRING, allowNull: false },
  fileType: { type: DataTypes.STRING },
  fileSize: { type: DataTypes.INTEGER },
  metadata: { type: DataTypes.JSONB },
  retentionDate: { type: DataTypes.DATE },
});

module.exports = Document;
