const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const logger = require("../utils/logger");

const config_file_path = path.join(__dirname, "./config.yaml");

let config = loadConfigFile();

fs.watchFile(config_file_path, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    loadConfigFile();
  }
});

// load config.yaml file
function loadConfigFile() {
  return yaml.load(
    fs.readFileSync(config_file_path, (err) => {
      if (err) {
        throw new Error("couldn't load config.yaml! please re-run the program");
      } else {
        logger.info("config was loaded successfully");
      }
    })
  );
}

// write config.yaml changes, send a restart log if required
function saveConfigFile(new_config) {
  if (new_config.PORT !== config.PORT) {
    setInterval(() => {
      logger.warn(
        "Port has been changed, please restart the server to apply changes"
      );
    }, 10000);
  }

  fs.writeFileSync(config_file_path, yaml.dump(new_config));
}

module.exports = {
  getYAMLConfig: () => config,
  updateConfig: (new_config) => saveConfigFile(new_config),
};
