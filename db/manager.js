const logger = require("../utils/logger");
const { addData, deleteData, updateCookie, getData } = require("./crud.db");
const { getYAMLConfig, updateConfig } = require("./config");

// update database sqlite
async function database({
  isCookie,
  cookie,
  subId,
  action,
  table_name,
}) {
  if (isCookie) {
    await updateCookie(cookie);
  } else {
    if (action == "delete") {
      await deleteData(table_name, subId);
    } else if (action == "insert") {
      await addData(table_name, subId);
    } else if (action == "read") {
      await getData(table_name, subId);
    }
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
  database,
  getConfig,
  handleConfigChange,
};
