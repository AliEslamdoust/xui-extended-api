const bcrypt = require("bcrypt");
const { getConfig } = require("../config");

// create a new hash for passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);

}

// compare stored hash with entered password
async function comparePassword(password) {
  const config = getConfig();

  if (!config || !config.accesscode) {
    throw new Error("Access code is not set in configuration.");
  }

  return await bcrypt.compare(password, config.accesscode);

}

module.exports = {
  hashPassword,
  comparePassword,
};
