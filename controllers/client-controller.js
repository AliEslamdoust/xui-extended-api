const { startInterval, stopInterval } = require("../jobs/scheduler");
const { updateClient, removeClientFromXUI, addClientToXUI } = require("../services/xui-api");
const { changeClientUsageInXUI } = require("../services/usage-service");
const { getClientBySubId, getAllClients } = require("../services/client-aggregator");
const { getAllData, addData, deleteData } = require("../db/local-queries");
const { getSubIdbyId, getAllSubIds, getSubIdbyEmail } = require("../utils/client-helpers");

// SYNC

// start clients status checking on current server
exports.startSync = (req, res) => {
    const timer = req.query.timer || 30;
    startInterval(timer);
    res.json({ ok: true, msg: "Clients status checking started." });
}

// stop clients status checking
exports.stopSync = (req, res) => {
    stopInterval();
    res.json({ ok: true, msg: "Clients status checking stopped." });
}

// CRUD

// update a client in xui
exports.updateClient = async (req, res) => {
    let client = req.body.client;

    if (!client) {
        return res.status(400).json({ ok: false, msg: "client data is required." });
    }

    let updatedClient = await updateClient(client);
    res.json(updatedClient);
}

// delete a client from xui
exports.removeClient = async (req, res) => {
    let client = req.body.client;

    if (!client) {
        return res.status(400).json({ ok: false, msg: "client data is required." });
    }

    let removedClient = await removeClientFromXUI(client);
    res.json(removedClient);
}

// add a client to xui
exports.addClient = async (req, res) => {
    let client = req.body.client;

    if (!client) {
        return res.status(400).json({ ok: false, msg: "client data is required." });
    }

    let addClient = await addClientToXUI(client);
    res.json(addClient);
}

// change a clients usage in xui database
exports.changeClientUsage = async (req, res) => {
    let client = req.body.client;

    if (!client) {
        return res.status(400).json({ ok: false, msg: "client data is required." });
    }

    let changeUsage = await changeClientUsageInXUI(client);
    res.json(changeUsage);
}

// get a client full information with their subId
exports.getClient = async (req, res) => {
    let subId = req.params.subId;
    if (!subId) {
        return res.status(400).json({ ok: false, msg: "subId is required." });
    }

    let clientInfo = await getClientBySubId(subId);
    res.json({ ok: true, data: clientInfo });
}

// get all clients full information
exports.getAllClients = async (req, res) => {
    let allClients = await getAllClients();
    res.json({ ok: true, data: allClients });
}

// get all clients subscription ids
exports.getAllSubIds = async (req, res) => {
    let subIds = await getAllSubIds();
    res.json({ ok: true, data: subIds });
}

// get all depleted users with the time of their expiration in timestamp
exports.getFinishedClient = async (req, res) => {
    let depletedUsers = await getAllData()
    res.json({ ok: true, data: depletedUsers });
}

// adds or removes specified subId from database (normally this is done for automatically fot overused traffic or outdated time limit users, but this endpoint allows manual addition)
exports.setDepletedFlag = async (req, res) => {
    let data = req.body.data;

    if (!data.subId) {
        return res.status(400).json({ ok: false, msg: "subId is required." });
    }
    if (data.isDepleted === false) {
        await deleteData([data.subId]);
    } else {
        await addData([data.subId]);
    }

    res.json({ ok: true, msg: `${data.subId} depleted flag was set to ${data.isDepleted}.` });
}

// get a clients' subId by providing their uuid
exports.subIdById = async (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).json({ ok: false, msg: "id is required." });
    }

    let subId = await getSubIdbyId(id);
    res.json({ ok: true, data: subId });
}

// get a clients' subId by providing their email
exports.subIdByEmail = async (req, res) => {
    let email = req.params.email;

    if (!email) {
        return res.status(400).json({ ok: false, msg: "email is required." });
    }

    let subId = await getSubIdbyEmail(email);
    res.json({ ok: true, data: subId });
}
