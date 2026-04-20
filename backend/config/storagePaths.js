const path = require("path");

const resolveStoragePath = (configuredPath, fallbackPath) => {
  const targetPath = (configuredPath || "").trim();

  if (!targetPath) {
    return fallbackPath;
  }

  return path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(__dirname, "..", targetPath);
};

const defaultDataDirectory = path.resolve(__dirname, "..", "data");
const dataDirectory = resolveStoragePath(process.env.DATA_DIR, defaultDataDirectory);
const sqliteFilePath = resolveStoragePath(
  process.env.SQLITE_STORAGE_PATH,
  path.join(dataDirectory, "itc_archive.sqlite"),
);
const uploadsDirectory = resolveStoragePath(
  process.env.UPLOADS_DIR,
  path.resolve(__dirname, "..", "uploads"),
);

module.exports = {
  dataDirectory,
  sqliteFilePath,
  uploadsDirectory,
};
