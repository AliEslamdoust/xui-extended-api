const logger = require("../utils/logger");

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

function addData(db, table_verbose, client_name) {
  let table_name = getTableName(table_verbose);

  let timestamp = Date.now();
  db.run(`INSERT INTO ${table_name} (client_name, timestamp) VALUES (?, ?)`, [
    client_name,
    timestamp,
  ]);
}

function deleteData(db, table_verbose, client_name) {
  let table_name = getTableName(table_verbose);

  db.run(`DELETE FROM ${table_name} WHERE client_name = ?`, [client_name]);
}

function updateCookie(db, cookie) {
  db.run(`INSERT OR REPLACE INTO cookie (cookie) VALUES (?)`, [cookie]);
}

module.exports = {
  addData,
  deleteData,
  updateCookie,
};
