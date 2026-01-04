const crypto = require("crypto");

function generateApiKey() {
  const key = crypto.randomBytes(32).toString("hex");
  const hash = hashApiKey(key);
  return { key, hash };
}

function hashApiKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function validateApiKey(inputKey) {
  if (!inputKey) return false;
  
  const config = require("../config").getConfig();
  const storedHash = config.API_KEY;
  if (!storedHash) return false;

  const inputHash = hashApiKey(inputKey);

  const bufferA = Buffer.from(inputHash);
  const bufferB = Buffer.from(storedHash);

  if (bufferA.length !== bufferB.length) return false;

  return crypto.timingSafeEqual(bufferA, bufferB);
}

module.exports = {
  validateApiKey,
  generateApiKey,
};
