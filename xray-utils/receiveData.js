const { getAllClientsUsage } = require("../db/crud.xui.db");
const { getConfig } = require("../db/manager");
const logger = require("../utils/logger");
// get all inbounds from xui database

// get all clients subscription ids
async function getAllSubIds() {
  let localInbounds = await getAllInbounds();
  let clients = new Array();

  for (let inbound_id of Object.keys(localInbounds)) {
    let inbound = localInbounds[inbound_id];

    for (let client of inbound) {
      let subId = client.subId;
      let clientExists = clients.includes(subId);

      if (!clientExists) clients.push(subId);
    }
  }

  return clients;
}

// get a clients information with their subscription id
async function getClientBySubId(subId) {
  let localInbounds = await getAllInbounds();

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
    let inbound_id = Object.keys(localInbounds)[index];
    let inbound = localInbounds[inbound_id];

    for (let client of inbound) {
      if (client.subId == subId) {
        data.id.push(client.id);
        data.email.push(client.email);
        data.inbound.push(parseInt(inbound_id));

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

  let allClientUsage = await getAllClientsUsage();
  for (let clientDetail of allClientUsage) {
    for (let email of data.email) {
      if (clientDetail.email == email) {
        data.up += clientDetail.up;
        data.down += clientDetail.down;
      }
    }
  }

  return data;
}

// get a clients subId by providing their id
async function getSubIdbyId(id) {
  let localInbounds = await getAllInbounds();
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
  let localInbounds = await getAllInbounds();
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

// get all inbounds with clients from xui database
async function getAllInbounds() {
  let config = getConfig();
  const inbound_ids = config.xui.inbounds;
  let localInbounds = new Object();

  for (let inbound of inbound_ids) {
    localInbounds[inbound] = await getAllInbounds(inbound);
  }

  return localInbounds;
}

module.exports = {
  getAllSubIds,
  getClientBySubId,
  getSubIdbyId,
  getSubIdbyEmail,
  inbounds: () => getAllInbounds(),
};
