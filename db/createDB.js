const path = require("path");
const fs = require("fs");
const { logger } = require("../utils/logger");

const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

function createDataBase(db) {
  try {
    db.serialize(() => {
      db.exec(schema, (err) => {
        if (err) {
          logger(err, "ERROR");
          return;
        }
        logger("Schema applied successfully.", "INFO");
      });
    });
    
    return true
  } catch (err) {
    logger(err, "ERROR");
    throw new Error(err);
  }
}

module.exports = {
  createDataBase,
};

// "INSERT OR REPLACE INTO outdated_clients (client_id, timestamp) VALUES (?, ?)
