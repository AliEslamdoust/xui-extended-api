const sqlite = require("sqlite3").verbose();
const path = require("path");
const { createDataBase } = require("./init-db");
const { getConfig } = require("../config");
const logger = require("../utils/logger");

const config = getConfig();

const dbPath = path.join(__dirname, "./db.sqlite");
// connect to sqlite3 database
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    logger.error(err);
  } else {
    logger.info("database was loaded successfully");
  }
});
createDataBase(db);

// connect to xui sqlite3 database
const xui_path = config.xui_database ? path.join(config.xui_database) : path.join(__dirname, "./x-ui.db");
const xui_db = new sqlite.Database(xui_path, (err) => {
  if (err) {
    logger.error(err);
  } else {
    logger.info("connected to X-UI database");
  }
});

module.exports = {
  db,
  xui_db,
};
