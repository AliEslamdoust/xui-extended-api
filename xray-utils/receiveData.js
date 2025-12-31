const { yamlData } = require("../db/manager");
const logger = require("../utils/logger");

// get all clients subscription ids
function getAllSubIds() {
  let clients = new Array();

  for (let inbound_id in Object.keys(localInbounds)) {
    let inbound = localInbounds[Object.keys(localInbounds)[inbound_id]];

    for (let index in inbound) {
      let subId = inbound[index].subId;
      let clientExists = false;

      for (let client of clients) {
        if (client == subId) {
          clientExists = true;
        }
      }

      if (!clientExists) {
        clients.push(subId);
      }
    }
  }

  return clients;
}

// get a clients information with their subscription id
async function getClientBySubId(subId) {
  await getAllInbounds();

  let data = {
    id: [],
    security: "auto",
    email: [],
    limitIp: 0,
    totalGB: 0,
    expiryTime: 0,
    enable: true,
    tgId: "",
    subId,
    reset: 0,
    down: 0,
    up: 0,
    inbound: [],
  };

  for (let index in Object.keys(localInbounds)) {
    let inbound = localInbounds[Object.keys(localInbounds)[index]];

    for (let client of inbound) {
      if (client.subId == subId) {
        data.id.push(client.id);
        data.email.push(client.email);
        data.inbound.push(parseInt(Object.keys(localInbounds)[index]));

        if (index == 0) {
          data.limitIp = client.limitIp;
          data.totalGB = client.totalGB;
          data.expiryTime = client.expiryTime;
          data.enable = client.enable;
          data.tgId = client.tgId;
          data.reset = client.reset;
        }
      }
    }
  }

  for (let email of data.email) {
    try {
      await new Promise((resolve, reject) => {
        xui_db.get(
          "SELECT up,down FROM client_traffics WHERE email = ?",
          [email],
          (err, res) => {
            if (err) {
              logger.error(err);
              reject(err);
            } else {
              if (res) {
                data.up += res.up;
                data.down += res.down;
                resolve("success");
              } else {
                logger.warn("client doesn't exist");
                reject("client doesn't exist");
              }
            }
          }
        );
      });
    } catch (err) {
      logger.error(err);
    }
  }

  return data;
}

// get a clients subId by providing their id
async function getSubIdbyId(id) {
  await getAllInbounds();
  let subId;

  for (let index in Object.keys(localInbounds)) {
    let inbound = localInbounds[Object.keys(localInbounds)[index]];

    for (let client of inbound) {
      if (client.id == id) {
        subId = client.subId;
      }
    }
  }

  return subId;
}

// get a clients subId by providing their email
async function getSubIdbyEmail(email) {
  await getAllInbounds();
  let subId;

  for (let index in Object.keys(localInbounds)) {
    let inbound = localInbounds[Object.keys(localInbounds)[index]];

    for (let client of inbound) {
      if (client.email == email) {
        subId = client.subId;
      }
    }
  }

  return subId;
}

// get all inbounds from xui database
async function getAllInbounds() {
  const inbound_ids = yamlData.xui.inbounds;
  let localInbounds = new Object();

  try {
    for (let inbound of inbound_ids) {
      let inbounds_data = await new Promise((resolve, reject) => {
        xui_db.get(
          "SELECT settings FROM inbounds WHERE id = ?",
          [inbound],
          (err, res) => {
            if (err) {
              logger.warn(err);
              reject(err);
            } else {
              resolve(JSON.parse(res.settings).clients);
            }
          }
        );
      });
      localInbounds[inbound] = inbounds_data;
    }
  } catch (err) {
    logger.error(err);
  } finally {
    return localInbounds;
  }
}

module.exports = {
  getAllSubIds,
  getClientBySubId,
  getSubIdbyId,
  getSubIdbyEmail,
  getAllInbounds,
};
