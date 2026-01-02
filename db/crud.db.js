const logger = require("../utils/logger");
const { db } = require("./connect.db");

async function getData(client_name) {
  if (!client_name) return {};

  return await new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM depleted_clients WHERE client_name = ?`,
      [client_name],
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

async function addData(client_name) {
  if (!client_name) return;

  let timestamp = Date.now();
  await new Promise((res, rej) => {
    db.run(
      `INSERT INTO depleted_clients (client_name, timestamp) VALUES (?, ?)`,
      [client_name, timestamp],
      (err) => {
        if (err) {
          logger.error(err);
          rej(err);
        } else {
          res();
        }
      }
    );
  });
}

async function deleteData(client_name) {
  if (!client_name) return;

  await new Promise((res, rej) => {
    db.run(
      `DELETE FROM depleted_clients WHERE client_name = ?`,
      [client_name],
      (err) => {
        if (err) {
          logger.error(err);
          rej(err);
        } else {
          res();
        }
      }
    );
  });
}

async function updateCookie(cookie) {
  await new Promise((res, rej) => {
    db.run(
      `INSERT OR REPLACE INTO cookie (cookie) VALUES (?)`,
      [cookie],
      (err) => {
        if (err) {
          logger.error(err);
          rej(err);
        } else {
          res();
        }
      }
    );
  });
}

module.exports = {
  addData,
  deleteData,
  updateCookie,
  getData,
};
