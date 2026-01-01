const logger = require("../utils/logger");
const { addData, deleteData, updateCookie, getData } = require("./crud.db");
const { getYAMLConfig, updateConfig } = require("./config");

// update database sqlite
function database({
  isCookie,
  cookie,
  subId,
  action,
  table_name,
  failed,
}) {
  try {
    if (isCookie) {
      updateCookie(cookie);
    } else {
      if (action == "delete") {
        deleteData(table_name, subId);
      } else if (action == "insert") {
        addData(table_name, subId);
      } else if (action == "read") {
        getData(table_name, subId);
      }
    }
  } catch (err) {
    logger.error(err);
    // re-try one more time in 5 seconds
    if (!failed)
      setTimeout(() => {
        database({
          isCookie,
          cookie,
          subId,
          action,
          table_name,
          failed: true,
        });
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
  database,
  getConfig,
  handleConfigChange,
};
