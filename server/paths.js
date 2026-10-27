// Where the SQLite file and uploads live.
// DATA_DIR is the persistent directory (Render disk mount).
// DB_PATH or DB_FILE is the full database file path and wins over DATA_DIR.
const path = require('path');

function resolveDataDir() {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  const explicit = process.env.DB_PATH || process.env.DB_FILE;
  if (explicit) return path.dirname(path.resolve(explicit));
  return path.join(__dirname, '..', 'data');
}

function resolveDbFile() {
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);
  if (process.env.DB_FILE) return path.resolve(process.env.DB_FILE);
  return path.join(resolveDataDir(), 'riders-plus.db');
}

const dataDir = resolveDataDir();

module.exports = {
  dataDir,
  dbFile: resolveDbFile(),
  uploadsDir: path.join(dataDir, 'uploads'),
};
