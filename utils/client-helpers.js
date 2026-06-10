const { getAllInbounds } = require("../db/xui-repository");

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

// get a client's subId by providing their id
async function getSubIdbyId(id) {
    const localInbounds = await getAllInbounds();

    // Iterate over just the arrays of clients directly
    for (const clients of Object.values(localInbounds)) {
        const match = clients.find(c => c.id == id);
        if (match) {
            return match.subId;
        }
    }

    return null;
}


// get a client's subId by providing their email
async function getSubIdbyEmail(email) {
    const localInbounds = await getAllInbounds();

    for (const clients of Object.values(localInbounds)) {
        const match = clients.find(c => c.email == email);
        if (match) {
            return match.subId;
        }
    }

    return null;
}

module.exports = {
    getAllSubIds,
    getSubIdbyId,
    getSubIdbyEmail,
};
