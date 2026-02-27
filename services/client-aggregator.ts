const { getAllClientsUsage, getClientUsage } = require("../db/xui");
const { getAllInbounds } = require("../db/xuiRepository");

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
                clientData.up += usage.up || 0;
                clientData.down += usage.down || 0;
            }
        }
    }

    // Convert the Map values back to an array
    return Array.from(clientsMap.values());
}

// get a client's full data by providing their subId
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
        subId,
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

module.exports = {
    getAllClients, getClientBySubId
}