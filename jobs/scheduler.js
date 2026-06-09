const logger = require("../utils/logger");
const { checkClients } = require("./usage-monitor");

let timerId = null
let isRunning = false

async function runJob(intervalTime) {
    if (isRunning) return;
    isRunning = true

    try {
        await checkClients()
        logger.info("Scheduled task: checkClients completed successfully.");
    }
    catch (e) {
        logger.error(`Scheduled task failed: ${e.message}`)
    }
    finally {
        isRunning = false
        if (timerId !== null) {
            timerId = setTimeout(() => { runJob(intervalTime) }, intervalTime * 1000)
        }
    }
}

function startInterval(intervalTime) {
    stopInterval()

    try {
        timerId = 1

        logger.info(`Starting scheduled task with interval: ${intervalTime} seconds.`);

        runJob(intervalTime)
    } catch (err) {
        logger.error(err);
    }
}

function stopInterval() {
    clearTimeout(timerId);
    timerId = null;
    logger.info("Scheduled task stopped.");
}

module.exports = {
    startInterval,
    stopInterval,
};
