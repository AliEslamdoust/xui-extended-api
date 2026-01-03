const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const logger = require("../utils/logger");

const config_file_path = path.join(__dirname, "./config.yaml");

let config = loadConfigFile();

fs.watchFile(config_file_path, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    logger.info("Config file change detected. Reloading...");

    config = loadConfigFile();
  }
});

// load config.yaml file
function loadConfigFile() {
  try {
    const fileContents = fs.readFileSync(config_file_path, 'utf8');
    logger.info("Config loaded successfully");
    return yaml.load(fileContents);
  } catch (err) {
    logger.error("CRITICAL: couldn't load config.yaml! please re-run the program");

    throw err;
  }
}

// write config.yaml changes, send a restart log if required
function saveConfigFile(new_config) {
  if (new_config.PORT !== config.PORT) {
    logger.warn(
      "PORT has been changed. You must RESTART the server for this to take effect."
    );
  }
  try {
    fs.writeFileSync(config_file_path, yaml.dump(new_config))

    logger.info("Config saved.");
  } catch (e) {
    logger.error("Failed to save config.yaml: " + err.message);

  }
}

module.exports = {
  getConfig: () => config,
  updateConfig: (new_config) => saveConfigFile(new_config),
};
