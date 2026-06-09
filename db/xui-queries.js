const logger = require("../utils/logger");
const { xui_db } = require("./db-connector");

async function updateClientUsage(email, traffic) {
  if (!email) return;

  return await new Promise((resolve, reject) => {
    xui_db.run(
      "UPDATE client_traffics SET up = 0, down = ? WHERE email = ?",
      [traffic || 0, email],
      (err) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

async function getInbounds(id) {
  return await new Promise((res, rej) => {
    xui_db.get(
      "SELECT settings FROM inbounds WHERE id = ?",
      [id],
      (err, row) => {
        if (err) {
          logger.error(err);
          rej(err);
        } else if (!row || !row.settings) {
          res([]);
        } else {
          try {
            const settings = JSON.parse(row.settings);
            res(settings.clients || []);
          } catch (parseErr) {
            logger.error(`Failed to parse inbound ${id} settings: ${parseErr}`);
            res([]);
          }
        }
      }
    );
  });
}

async function getAllClientsUsage() {
  return await new Promise((resolve, reject) => {
    xui_db.all("SELECT * FROM client_traffics", [], (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function getClientUsage(emails = []) {
  if (!emails || emails.length === 0) return [];

  return await new Promise((resolve, reject) => {
    let placeholder = emails.map(() => "?").join(",");

    xui_db.all(
      `SELECT * FROM client_traffics WHERE email IN (${placeholder})`,
      emails,
      (err, res) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          resolve(res);
        }
      }
    );
  });
}

module.exports = {
  updateClientUsage,
  getInbounds,
  getAllClientsUsage,
  getClientUsage,
};
