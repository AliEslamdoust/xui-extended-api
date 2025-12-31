const sqlite = require("sqlite3").verbose();
const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const { logger } = require("../utils/logger");

let inboundsLastUpdate = 0;
let yamlData, database;

const config_file_path = path.join(__dirname, "./config.yaml");
loadConfigFile(); // load config.yaml file
const log_file_path = path.join(__dirname, "./log.txt");

const database_file_path = path.join(__dirname, "./db.json");
const database_backup_file_path = path.join(__dirname, "./db_backup.json");
loadLocalDatabase(); // load db.json file

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
    database = JSON.parse(fs.readFileSync(database_file_path));

    setInterval(() => {
      inboundsLastUpdate++;
    }, 1000);

    console.log("database was loaded successfully");
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

// update database json file
function updateDatabase(failed) {
  try {
    let file_path;
    if (failed) file_path = database_backup_file_path;
    else file_path = database_file_path;

    fs.writeFile(file_path, JSON.stringify(database), (err) => {
      if (err) {
        updateDatabase(true);
        logger(err, "ERROR");
      }
    });
  } catch (err) {
    logger(err, "ERROR");
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
  database,
  config_file_path,
  log_file_path,
  database_file_path,
  database_backup_file_path,
  PORT,
};
