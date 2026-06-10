const winston = require("winston");
const path = require("path");

const mainFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaString}`;
  }
);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    mainFormat
  ),
  transports: [
    new winston.transports.Console(
      {
        format: winston.format.combine(
          winston.format.colorize(),
          mainFormat
        )
      }),
    new winston.transports.File({
      filename: path.join(__dirname, "../log/app.log"),
    }),
  ],
});

module.exports = logger;
