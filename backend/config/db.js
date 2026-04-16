const path = require("path");
const { Sequelize } = require("sequelize");

const {
  DATABASE_URL,
  DB_NAME = "itc_archive",
  DB_USER = "postgres",
  DB_PASS = "postgres",
  DB_HOST = "localhost",
  DB_PORT = "5432",
} = process.env;

const hasExternalDatabase = Boolean(DATABASE_URL);

const sequelize = hasExternalDatabase
  ? new Sequelize(DATABASE_URL, {
      dialect: "postgres",
      logging: false,
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: path.join(__dirname, "..", "data", "itc_archive.sqlite"),
      logging: false,
    });

module.exports = sequelize;
