const { Sequelize } = require("sequelize");

const {
  DATABASE_URL,
  DB_NAME = "itc_archive",
  DB_USER = "postgres",
  DB_PASS = "postgres",
  DB_HOST = "localhost",
  DB_PORT = "5432",
} = process.env;

const databaseUrl =
  DATABASE_URL ||
  `postgres://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASS)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
});

module.exports = sequelize;
