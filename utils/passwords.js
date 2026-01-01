const bcrypt = require("bcrypt");
const { getYAMLConfig } = require("../db/config");

// create a new hash for passwords
async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  return hash;
}

// compare stored hash with entered password
async function comparePassword(password) {
  const config = getYAMLConfig();

  const result = await bcrypt.compare(password, config.accesscode);
  
  return result;
}

module.exports = {
  hashPassword,
  comparePassword,
};
