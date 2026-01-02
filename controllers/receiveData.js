const { getClientUsage, getAllClientsUsage, getInbounds } = require("../db/crud.xui.db");
const { getConfig } = require("../db/manager");

// get all clients subscription ids
async function getAllSubIds() {
  const localInbounds = await getAllInbounds();

  const uniqueSubIds = new Set();

  for (const clients of Object.values(localInbounds)) {
    for (const client of clients) {
      if (client.subId) {
        uniqueSubIds.add(client.subId);
      }
    }
  }

  return Array.from(uniqueSubIds);
}

// get all clients information
async function getAllClients() {
  let localInbounds = await getAllInbounds();

  let allUsage = await getAllClientsUsage();

  let usageMap = new Map()
  for (const u of allUsage) {
    usageMap.set(u.email, { ...u });
  }
  
  const clientsMap = new Map();

  for (const [inboundId, inboundClients] of Object.entries(localInbounds)) {

    for (const client of inboundClients) {
      let clientData = clientsMap.get(client.subId);

      // If client doesn't exist in our list yet, create it completely fresh
      if (!clientData) {
        clientData = {
          id: [],
          security: "auto",
          email: [],
          limitIp: client.limitIp,
          totalGB: client.totalGB,
          expiryTime: client.expiryTime,
          enable: client.enable,
          tgId: client.tgId || "",
          subId: client.subId,
          reset: client.reset,
          down: 0,
          up: 0,
          inbound: [],
        };
        clientsMap.set(client.subId, clientData);
      }

      clientData.id.push(client.id);
      clientData.email.push(client.email);
      clientData.inbound.push(parseInt(inboundId));

      // Only add traffic for THIS specific email address
      const usage = usageMap.get(client.email);
      if (usage) {
        for (let u of usage) {
          clientData.up += u.up || 0;
          clientData.down += u.down || 0;
        }
      }
    }
  }

  // Convert the Map values back to an array
  return Array.from(clientsMap.values());
}
async function getClientBySubId(subId) {
  const localInbounds = await getAllInbounds();

  const data = {
    id: [],
    security: "auto",
    email: [],
    limitIp: 0,
    totalGB: 0,
    expiryTime: 0,
    enable: true,
    tgId: "",
    subId: subId,
    reset: 0,
    down: 0,
    up: 0,
    inbound: [],
  };

  let isFound = false;

  for (const [inboundId, clients] of Object.entries(localInbounds)) {

    const client = clients.find(c => c.subId == subId);

    if (client) {
      data.id.push(client.id);
      data.email.push(client.email);
      data.inbound.push(parseInt(inboundId));

      if (!isFound) {
        data.limitIp = client.limitIp;
        data.totalGB = client.totalGB;
        data.expiryTime = client.expiryTime;
        data.enable = client.enable;
        data.tgId = client.tgId;
        data.reset = client.reset;
        isFound = true;
      }
    }
  }

  if (!isFound) return null;

  const allUsage = await getClientUsage(data.email);
  for (const usage of allUsage) {
    data.up += usage.up || 0;     // Safety check for null/undefined
    data.down += usage.down || 0; // Safety check for null/undefined
  }

  return data;
}

// get a client's subId by providing their id
async function getSubIdbyId(id) {
  const localInbounds = await getAllInbounds();

  // Iterate over just the arrays of clients directly
  for (const clients of Object.values(localInbounds)) {
    const match = clients.find(c => c.id == id);
    if (match) {
      return match.subId; // Stop searching immediately!
    }
  }

  return null; // Return null if not found
}

// get a client's subId by providing their email
async function getSubIdbyEmail(email) {
  const localInbounds = await getAllInbounds();

  for (const clients of Object.values(localInbounds)) {
    const match = clients.find(c => c.email == email);
    if (match) {
      return match.subId; // Stop searching immediately!
    }
  }

  return null;
}

// get all inbounds with clients from xui database
async function getAllInbounds() {
  const config = getConfig();
  const inboundIds = config.xui.inbounds;

  const promises = inboundIds.map(async (id) => {
    const clients = await getInbounds(id); // fetching the single ID
    return { id, clients };
  });

  const results = await Promise.all(promises);

  const localInbounds = {};
  for (const result of results) {
    localInbounds[result.id] = result.clients;
  }

  return localInbounds;
}

module.exports = {
  getAllSubIds,
  getClientBySubId,
  getSubIdbyId,
  getSubIdbyEmail,
  inbounds: () => getAllInbounds(), getAllClients
};
