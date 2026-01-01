const logger = require("../utils/logger");
const { checkClients } = require("../xray-utils/alterData");

let interval;

function startInterval(time) {
  clearInterval(interval);
  try {
    checkClients();
    interval = setInterval(checkClients, time * 1000);

    logger.info(`Checked clients status successfully!`);
  } catch (err) {
    logger.error(err);
  }
}

function stopInterval() {
  clearInterval(interval);
}

module.exports = {
  startInterval,
  stopInterval,
};
