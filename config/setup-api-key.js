const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const logger = require("../utils/logger");

const temp_config_file_path = path.join(__dirname, "./config.template.yaml");
const config_file_path = path.join(__dirname, "./config.yaml");

function setAPIKey(newApiKeyHash) {
  try {
    const config = loadTempConfigFile();
    config.API_KEY = newApiKeyHash;
    saveConfigFile(config);

    return true;
  } catch (err) {
    logger.error(
      "Failed to set API Key in config.template.yaml: " + err.message
    );

    return false;
  }
}

// load config.template.yaml file
function loadTempConfigFile() {
  try {
    const fileContents = fs.readFileSync(temp_config_file_path, "utf8");
    logger.info("Template Config loaded successfully");
    return yaml.load(fileContents);
  } catch (err) {
    logger.error(
      "CRITICAL: couldn't load config.template.yaml! please make sure config.template.yaml exists"
    );

    throw err;
  }
}

function saveConfigFile(config) {
  try {
    fs.writeFileSync(config_file_path, yaml.dump(config));
  } catch (err) {
    logger.error(
      "Failed to save config.template.yaml to config.yaml: " + err.message
    );

    throw err;
  }
}

module.exports = {
  setAPIKey,
};
