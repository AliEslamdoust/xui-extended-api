const fs = require("fs");
const yaml = require("js-yaml");
const {
  database_file_path,
  database_backup_file_path,
  config_file_path,
  yamlData,
  database,
} = require("../connect");



module.export = {
  loadLocalDatabase,
  loadConfigFile,
  updateDatabase,
  updateYAMLFile,
};
