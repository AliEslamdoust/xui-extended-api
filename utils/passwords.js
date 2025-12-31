const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

// create a new hash for passwords
async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  return hash;
}

// compare stored hash with entered password
async function comparePassword(password) {
  try {
    const result = await bcrypt.compare(password, yamlData.accesscode);
    return result;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
};
