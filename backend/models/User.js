const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "changeme123",
    },
    role: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

module.exports = User;
