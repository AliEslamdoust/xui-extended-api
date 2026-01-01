const logger = require("../utils/logger");
const { xui_db } = require("./connect.db");

async function updateClientUsage(user_email, traffic) {
  return await new Promise((resolve, reject) => {
    xui_db.run(
      "UPDATE client_traffics SET up = 0, down = ? WHERE email = ?",
      [traffic, user_email],
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

async function getAllInbounds(id) {
  return await new Promise((resolve, reject) => {
    xui_db.get(
      "SELECT settings FROM inbounds WHERE id = ?",
      [id],
      (err, res) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else if (!res) {
          resolve({});
        } else {
          resolve(JSON.parse(res.settings).clients);
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
  getAllInbounds,
  getAllClientsUsage,
  getClientUsage,
};
