const express = require("express");
const router = express.Router();
const { restartXray } = require("../controllers/restartXray");
const {
  startInterval,
  stopInterval,
} = require("../controllers/checkClientsInterval");
const { updateClient } = require("../controllers/alterData");

// start clients status checking on current server
router.get("/api/startSync", (req, res) => {
  const timer = req.query.timer || 30;
  startInterval(timer);

  res.json({ ok: true, msg: "Clients status checking started." });
});

// stop clients status checking
router.get("/api/stopSync", (req, res) => {
  stopInterval();

  res.json({ ok: true, msg: "Clients status checking stopped." });
});

// update a client in xui
router.post("/api/updateClient", async (req, res) => {
  let client = req.body.client;
  let update_client = await updateClient(client);

  res.json(update_client);
});

// delete a client from xui
router.post("/api/removeClient", async (req, res) => {
  let client = req.body.client;
  let removeClient = await removeClientFromXUI(client.id, client.inbound);

  res.json(removeClient);
});

// add a client to xui
router.post("/api/addClient", async (req, res) => {
  let client = req.body.client;
  let addClient = await addClientToXUI(client);

  res.json(addClient);
});

// change a clients usage in xui database
router.post("/api/changeClientUsage", async (req, res) => {
  let client = req.body.client;
  let changeUsage = await changeClientUsage(client);

  res.json(changeUsage);
});

// get a client full information with their subId
router.get("/api/getClient/:subId", async (req, res) => {
  let subId = req.params.subId;

  let clientInfo = await getClientBySubId(subId);

  res.json({ ok: true, data: clientInfo });
});

// get all overused/outdated clients with the time of their expiration in timestamp
router.get("/api/getFinishedClient", async (req, res) => {
  let users_data = {
    outdated: database.outdated_clients,
    overused: database.overused_clients,
  };

  res.json({ ok: true, data: users_data });
});

// add the specified subId to database to prevent from syncing between configs (normally this is done for overused/outdated to reduce proccessing time)
router.get("/api/stopClientSyncing/:subId", async (req, res) => {
  let subId = req.params.subId;
  let timestamp = Date.now();

  database.overused_clients[subId] = timestamp;
  updateDatabase();

  res.json({ ok: true, msg: "clients' syncing stopped" });
});

// removes the specified subId from overused/outdated so its' configs usage can be synced together
router.get("/api/syncClient/:subId", async (req, res) => {
  let subId = req.params.subId;

  delete database.outdated_clients[subId];
  delete database.overused_clients[subId];
  updateDatabase();

  res.json({ ok: true, msg: "clients' syncing started" });
});

// reload database and config.yaml
router.get("/api/reload", async (req, res) => {
  loadConfigFile(); // load config.yaml file
  await getAllInbounds(); // get all inounbds from xui database
  getCookie().then(loadLocalDatabase()); // get cookies and store them in database // load db.json file
  res.json({ ok: true, msg: "reloaded successfully" });
});

// change hash passowrd
router.post("/api/updatePassword", async (req, res) => {
  const new_password = req.headers.password;

  let new_hash = await hashPassword(new_password);
  yamlData.accesscode = new_hash;

  updateYAMLFile();
  res.json({ ok: true, msg: "reloaded successfully" });
});

// get a clients' subId by providing their uuid
router.get("/api/SIDbyID/:id", async (req, res) => {
  let id = req.params.id;

  let subId = await getSubIdbyId(id);

  res.json({ ok: true, data: subId });
});

// get a clients' subId by providing their email
router.get("/api/SIDbyEmail/:email", async (req, res) => {
  let email = req.params.email;

  let subId = await getSubIdbyEmail(email);

  res.json({ ok: true, data: subId });
});

// request for restarting xray core
router.get("/api/restartXray", async (req, res) => {
  await restartXray();

  res.json({ ok: true, msg: "xray core restarted successfully" });
});

module.exports = router;
