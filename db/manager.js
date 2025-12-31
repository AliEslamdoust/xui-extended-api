const sqlite = require("sqlite3").verbose();
const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const { logger } = require("../utils/logger");
const { createDataBase } = require("./createDB");
const { addData, deleteData, updateCookie } = require("./crud_db");

let inboundsLastUpdate = 0;
let yamlData;

const config_file_path = path.join(__dirname, "./config.yaml");
loadConfigFile(); // load config.yaml file

const dbPath = path.join(__dirname, "./db.sqlite");
loadLocalDatabase();
const PORT = yamlData.port;

// connect to sqlite3 database
const xui_path = path.join(yamlData.xui_database);
const xui_db = new sqlite.Database(xui_path, (err) => {
  if (err) {
    logger(err, "ERROR");
  } else {
    logger("connected to X-UI database", "INFO");
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

    logger("database was loaded successfully", "INFO");
  } catch (err) {
    logger(err, "ERROR");
  }
}

// load config.yaml file
function loadConfigFile() {
  try {
    yamlData = yaml.load(fs.readFileSync(config_file_path));

    setInterval(() => {
      inboundsLastUpdate++;
    }, 1000);

    console.log("yamlData was loaded successfully");
  } catch (err) {
    console.log("couldn't load config.yaml! please re-run the program");
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
    logger(err, "ERROR");
    // re-try one more time in 5 seconds
    if (!failed)
      setTimeout(() => {
        updateDatabase(isCookie, user, isDelete, table_name, true);
      }, 5000);
  }
}

function updateYAMLFile() {
  let response;
  try {
    let yaml_dump = yaml.dump(yamlData);

    fs.writeFile(config_file_path, yaml_dump, (err) => {
      if (err) {
        logger(err, "ERROR");
        response = { ok: false, msg: "an unexpected error has occured" };
      } else {
        response = { ok: true, msg: "config file updated" };
      }
    });

    loadConfigFile();
  } catch (err) {
    logger(err, "ERROR");
    response = { ok: false, msg: "an unexpected error has occured" };
  } finally {
    return response;
  }
}

module.exports = {
  xui_db,
  yamlData,
  config_file_path,
  PORT,
  updateDatabase,
  updateYAMLFile,
};
