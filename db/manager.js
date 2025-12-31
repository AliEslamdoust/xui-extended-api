const sqlite = require("sqlite3").verbose();
const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const logger = require("../utils/logger");
const { createDataBase } = require("./createDB");
const { addData, deleteData, updateCookie } = require("./crud_db");
const { getYAMLConfig, updateConfig } = require("./config");

let inboundsLastUpdate = 0;

const dbPath = path.join(__dirname, "./db.sqlite");
loadLocalDatabase();
const PORT = getConfig().port;

// connect to sqlite3 database
const xui_path = path.join(getConfig().xui_database);
const xui_db = new sqlite.Database(xui_path, (err) => {
  if (err) {
    logger.error(err);
  } else {
    logger.info("connected to X-UI database");
  }
});

// update local database variable "database"
function loadLocalDatabase() {
  try {
    const db = new sqlite.Database(dbPath);
    createDataBase(db);

    setInterval(() => {
      inboundsLastUpdate++;
    }, 1000);

    logger.info("database was loaded successfully");
  } catch (err) {
    logger.error(err);
  }
}

// update database sqlite
function updateDatabase(isCookie, user, isDelete, table_name, failed) {
  try {
    if (isCookie) {
      updateCookie(db, database.cookie);
    } else {
      if (isDelete) {
        deleteData(db, table_name, user);
      } else {
        addData(db, table_name, user);
      }
    }
  } catch (err) {
    logger.error(err);
    // re-try one more time in 5 seconds
    if (!failed)
      setTimeout(() => {
        updateDatabase(isCookie, user, isDelete, table_name, true);
      }, 5000);
  }
}

function handleConfigChange(new_config) {
  try {
    updateConfig(new_config);
    logger.info("config file was updated successfully");
  } catch (err) {
    logger.error(err);
  }
}

function getConfig() {
  return getYAMLConfig();
}

module.exports = {
  xui_db,
  yamlData,
  config_file_path,
  PORT,
  updateDatabase,
  getConfig,
  handleConfigChange,
};
