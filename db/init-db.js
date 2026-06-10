const path = require("path");
const fs = require("fs");
const  logger  = require("../utils/logger");

const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

function createDataBase(db) {
  try {
    db.serialize(() => {
      db.exec(schema, (err) => {
        if (err) {
          logger.error(err);
          return;
        }
        logger.info("Schema applied successfully.");
      });
    });
    
    return true
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
}

module.exports = {
  createDataBase,
};
