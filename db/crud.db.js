const logger = require("../utils/logger");
const { db } = require("./connect.db");

let table_names = {
  overused: "overused_clients",
  outdated: "outdated_clients",
};

function getTableName(verbose) {
  if (Object.keys(table_names).includes(verbose)) {
    return table_names[verbose];
  } else {
    logger.error(`Table Name is not valid. Received table name: ${verbose}`);

    throw new Error(`Table Name is not valid. Received table name: ${verbose}`);
  }
}

async function getData(table_verbose, client_name) {
  if (!client_name) return {};
  let table_name = getTableName(table_verbose);

  return await new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM ${table_name} WHERE client_name = ?`,
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

async function addData(table_verbose, client_name) {
  if (!client_name) return;
  let table_name = getTableName(table_verbose);

  let timestamp = Date.now();
  await new Promise((res, rej) => {
    db.run(
      `INSERT INTO ${table_name} (client_name, timestamp) VALUES (?, ?)`,
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

async function deleteData(table_verbose, client_name) {
  if (!client_name) return;
  let table_name = getTableName(table_verbose);

  await new Promise((res, rej) => {
    db.run(
      `DELETE FROM ${table_name} WHERE client_name = ?`,
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
