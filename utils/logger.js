const fs = require("fs");
const path = require("path");

const log_file_path = path.join(__dirname, "../logs.log");

// get the date in this format: YYYY-MM-DD HH:MM:SS
function getCurrentDate() {
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDay()).padStart(2, "0");
  let hour = String(now.getHours()).padStart(2, "0");
  let minute = String(now.getMinutes()).padStart(2, "0");
  let second = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// log everything to log.txt
function logger(log, level) {
  try {
    fs.appendFile(
      log_file_path,
      `[${getCurrentDate()}] ${level}: ${log}\n`,
      (error) => {
        if (error) {
          console.log(
            "An error occured while logging: ",
            error,
            "retrying in 5 seconds..."
          );
          setTimeout(() => {
            logger(log, level);
          }, 5000);
        } else {
          console.log(log, "See logs.log for full info");
        }
      }
    );
  } catch (err) {
    console.log(err);

    logger(err, "ERROR");
  }
}

module.exports = { logger };
