const logger = require("../utils/logger");
const { addData, getAllData } = require("../db/local-queries");
const { getAllClients } = require("../services/client-aggregator");
const { updateClient } = require("../services/xui-api");

// this function checks clients status (overusing traffic and time expiry) and adds users to a exceptions list in database
async function checkClients() {
    const [allClients, depletedRows] = await Promise.all([
        getAllClients(),
        getAllData()
    ]);
    const timestamp = Date.now();

    let newDepletedClients = new Set();
    const depletedSet = new Set(depletedRows.map(row => row.client_name));

    for (const client of allClients) {
        // Check DB (Exceptions list)
        if (depletedSet.has(client.subId)) continue;

        // Calculate conditions cleanly
        const usedTraffic = client.up + client.down;

        // True if limit exists (>0) AND usage >= limit
        const isTrafficLimitReached = (client.totalGB > 0) && (usedTraffic >= client.totalGB);

        // True if limit exists (!=0) AND current time > expiry
        const isExpired = (client.expiryTime !== 0) && (timestamp > client.expiryTime);

        if (isTrafficLimitReached || isExpired) {

            const updatePromises = client.email.map((email, index) => {
                const temp_client = {
                    ...client,
                    email: email,
                    id: client.id[index],
                    inbound: client.inbound[index],
                    enable: false,
                };
                return updateClient(temp_client);
            });

            try {
                await Promise.all(updatePromises);

                newDepletedClients.add(client.subId);
            } catch (err) {
                logger.error(`Error disabling client ${client.subId} from xui api : ${err}`);
            }
        }

    }

    const clientsToDisable = Array.from(newDepletedClients);
    if (clientsToDisable.length > 0) await addData(clientsToDisable)
}

module.exports = { checkClients }
