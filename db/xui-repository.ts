const { getConfig } = require("../config");
const { getInbounds } = require("./xui");

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

module.exports = { getAllInbounds };