const express = require("express");
const router = express.Router();
const { restartXray } = require("../xray-utils/restartXray");

// start sync of clients usage on current server
router.get("/api/startSync", (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);

  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  const timer = req.query.timer;
  startInterval(timer * 1000);

  res.json({ ok: true, msg: "interval started" });
});

// stop clients syncins
router.get("/api/stopSync", (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  stopInterval();

  res.json({ ok: true, msg: "interval stopped" });
});

// update a client in xui
router.post("/api/updateClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

    let client = req.body.client;
    let update_client = await updateClient(client);

    res.json(update_client);
});

// delete a client from xui
router.post("/api/removeClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let client = req.body.client;
  let removeClient = await removeClientFromXUI(client.id, client.inbound);

  res.json(removeClient);
});

// add a client to xui
router.post("/api/addClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let client = req.body.client;
  let addClient = await addClientToXUI(client);

  res.json(addClient);
});

// change a clients usage in xui database
router.post("/api/changeClientUsage", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let client = req.body.client;
  let changeUsage = await changeClientUsage(client);

  res.json(changeUsage);
});

// get a client full information with their subId
router.get("/api/getClient/:subId", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let subId = req.params.subId;

  let clientInfo = await getClientBySubId(subId);

  res.json({ ok: true, data: clientInfo });
});

// get all overused/outdated clients with the time of their expiration in timestamp
router.get("/api/getFinishedClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let users_data = {
    outdated: database.outdated_clients,
    overused: database.overused_clients,
  };

  res.json({ ok: true, data: users_data });
});

// add the specified subId to database to prevent from syncing between configs (normally this is done for overused/outdated to reduce proccessing time)
router.get("/api/stopClientSyncing/:subId", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let subId = req.params.subId;
  let timestamp = Date.now();

  database.overused_clients[subId] = timestamp;
  updateDatabase();

  res.json({ ok: true, msg: "clients' syncing stopped" });
});

// removes the specified subId from overused/outdated so its' configs usage can be synced together
router.get("/api/syncClient/:subId", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let subId = req.params.subId;

  delete database.outdated_clients[subId];
  delete database.overused_clients[subId];
  updateDatabase();

  res.json({ ok: true, msg: "clients' syncing started" });
});

// reload database and config.yaml
router.get("/api/reload", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  loadConfigFile(); // load config.yaml file
  await getAllInbounds(); // get all inounbds from xui database
  getCookie().then(loadLocalDatabase()); // get cookies and store them in database // load db.json file
  res.json({ ok: true, msg: "reloaded successfully" });
});

// change hash passowrd
router.post("/api/updatePassword", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  const new_password = req.headers.password;

  let new_hash = await hashPassword(new_password);
  yamlData.accesscode = new_hash;

  updateYAMLFile();
  res.json({ ok: true, msg: "reloaded successfully" });
});

// get a clients' subId by providing their uuid
router.get("/api/SIDbyID/:id", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let id = req.params.id;

  let subId = await getSubIdbyId(id);

  res.json({ ok: true, data: subId });
});

// get a clients' subId by providing their email
router.get("/api/SIDbyEmail/:email", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  let email = req.params.email;

  let subId = await getSubIdbyEmail(email);

  res.json({ ok: true, data: subId });
});

// request for restarting xray core
router.get("/api/restartXray", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  await restartXray();

  res.json({ ok: true, msg: "xray core restarted successfully" });
});

module.exports = router;
