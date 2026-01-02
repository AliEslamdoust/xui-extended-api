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

async function getAllData() {
  return await new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM depleted_clients`,
      [],
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

async function addData(client_names) {
  if (!client_names || client_names.length === 0) return;

  let placeholder = client_names.map(() => "(?, ?)").join(", ");
  let timestamp = Date.now();

  let values = client_names.flatMap(name => [name, timestamp]);

  await new Promise((res, rej) => {
    db.run(
      `INSERT OR IGNORE INTO depleted_clients (client_name, timestamp) VALUES ${placeholder}`,
      values,
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

async function deleteData(client_names) {
  if (!client_names || client_names.length === 0) return;

  let placeholder = client_names.map(() => "?").join(", ");

  await new Promise((res, rej) => {
    db.run(
      `DELETE FROM depleted_clients WHERE client_name IN ${placeholder}`,
      client_names,
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
  getAllData
};
