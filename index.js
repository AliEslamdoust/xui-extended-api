const express = require("express");
const app = express();
const axios = require("axios");
const fs = require("fs");
const yaml = require("js-yaml");
const sqlite = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");
const restartXray = require("./utils/restartXray");

app.use(bodyParser.json());
app.use(express.json());

let yamlData, database, interval;
let localInbounds = new Object();
let inboundsLastUpdate = 0;

const config_file_path = path.join("/root/telegram-api/db/config.yaml");
loadConfigFile(); // load config.yaml file
const log_file_path = path.join(yamlData.log_file);

const database_file_path = path.join(yamlData.db_json);
const database_backup_file_path = path.join(yamlData.backup_file);
loadLocalDatabase(); // load db.json file

const PORT = yamlData.port;

// connect to sqlite3 database
const xui_path = path.join(yamlData.xui_database);
const db = new sqlite.Database(xui_path, (err) => {
  if (err) {
    logger(err, "ERROR");
  } else {
    logger("connected to X-UI database", "INFO");
  }
});

getAllInbounds(); // get all inounbds from xui database

// API
// start sync of clients usage on current server
app.get("/api/startSync/", (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);

  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    const timer = req.query.timer;
    startInterval(timer * 1000);

    res.json({ ok: true, msg: "interval started" });
  } catch (err) {
    logger(err, "ERROR");
    res.json({ ok: false, msg: err });
  }
});

// stop clients syncins
app.get("/api/stopSync", (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  stopInterval();

  res.json({ ok: true, msg: "interval stopped" });
});

// update a client in xui
app.post("/api/updateClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let client = req.body.client;
    let update_client = await updateClient(client);

    res.json(update_client);
  } catch (err) {
    logger(err, "ERROR");
    res.json({ ok: false, msg: err });
  }
});

// delete a client from xui
app.post("/api/removeClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let client = req.body.client;
    let removeClient = await removeClientFromXUI(client.id, client.inbound);

    res.json(removeClient);
  } catch (err) {
    logger(err, "ERROR");
    res.json({ ok: false, msg: err });
  }
});

// add a client to xui
app.post("/api/addClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let client = req.body.client;
    let addClient = await addClientToXUI(client);

    res.json(addClient);
  } catch (err) {
    logger(err, "ERROR");
    res.json({ ok: false, msg: err });
  }
});

// change a clients usage in xui database
app.post("/api/changeClientUsage", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let client = req.body.client;
    let changeUsage = await changeClientUsage(client);

    res.json(changeUsage);
  } catch (err) {
    logger(err, "ERROR");
    res.json({ ok: false, msg: err });
  }
});

// get a client full information with their subId
app.get("/api/getClient/:subId", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let subId = req.params.subId;

    let clientInfo = await getClientBySubId(subId);

    res.json({ ok: true, data: clientInfo });
  } catch (err) {
    res.json({ ok: false, data: null });
  }
});

// get all overused/outdated clients with the time of their expiration in timestamp
app.get("/api/getFinishedClient", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let users_data = {
      outdated: database.outdated_clients,
      overused: database.overused_clients,
    };

    res.json({ ok: true, data: users_data });
  } catch (err) {
    res.json({ ok: false, data: null });
  }
});

// add the specified subId to database to prevent from syncing between configs (normally this is done for overused/outdated to reduce proccessing time)
app.get("/api/stopClientSyncing/:subId", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let subId = req.params.subId;
    let timestamp = Date.now();

    database.overused_clients[subId] = timestamp;
    updateDatabase();

    res.json({ ok: true, msg: "clients' syncing stopped" });
  } catch (err) {
    res.json({ ok: false, msg: "error in stopping clients' syncing" });
  }
});

// removes the specified subId from overused/outdated so its' configs usage can be synced together
app.get("/api/syncClient/:subId", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let subId = req.params.subId;

    delete database.outdated_clients[subId];
    delete database.overused_clients[subId];
    updateDatabase();

    res.json({ ok: true, msg: "clients' syncing started" });
  } catch (err) {
    res.json({
      ok: false,
      msg: "error in starting clients' syncing",
    });
  }
});

// reload database and config.yaml
app.get("/api/reload", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    loadConfigFile(); // load config.yaml file
    await getAllInbounds(); // get all inounbds from xui database
    getCookie().then(loadLocalDatabase()); // get cookies and store them in database // load db.json file
    res.json({ ok: true, msg: "reloaded successfully" });
  } catch (err) {
    res.json({ ok: false, msg: "internal error in reloading configs" });
  }
});

// change hash passowrd
app.post("/api/updatePassword", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    const new_password = req.headers.password;

    let new_hash = await hashPassword(new_password);
    yamlData.accesscode = new_hash;

    updateYAMLFile();
    res.json({ ok: true, msg: "reloaded successfully" });
  } catch (err) {
    res.json({ ok: false, msg: "internal error in reloading configs" });
  }
});

// get a clients' subId by providing their uuid
app.get("/api/SIDbyID/:id", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let id = req.params.id;

    let subId = await getSubIdbyId(id);

    res.json({ ok: true, data: subId });
  } catch (err) {
    res.json({ ok: false, data: null });
  }
});

// get a clients' subId by providing their email
app.get("/api/SIDbyEmail/:email", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    let email = req.params.email;

    let subId = await getSubIdbyEmail(email);

    res.json({ ok: true, data: subId });
  } catch (err) {
    res.json({ ok: false, data: null });
  }
});

// request for restarting xray core
app.get("/api/restartXray", async (req, res) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);
  if (!compareKey) {
    res.json({ ok: false, msg: "false access code" });
  }

  try {
    await restartXray();

    res.json({ ok: true, msg: "xray core restarted successfully" });
  } catch (err) {
    res.json({ ok: false, msg: err });
  }
});

// a function to restart the xray core when it's called


function startInterval(time) {
  clearInterval(interval);

  syncClients();
  interval = setInterval(() => {
    syncClients();
  }, time);
}

function stopInterval() {
  clearInterval(interval);
}

// sync all clients with the same subId
async function syncClients() {
  try {
    // if inbounds are not updated in the last "reload_delay" seconds ("reload_delay" is a vaiable that can be edited in config.yaml file), update all inbounds information to sync the last data
    if (inboundsLastUpdate >= yamlData.reload_delay) {
      getAllInbounds();

      inboundsLastUpdate = 0;
    }

    let allClients = getAllSubIds(); // get all subIds

    for (let client of allClients) {
      let clientInfo = await getClientBySubId(client); // get clients full information with their subId

      let client_finished = false;

      Object.keys(database.overused_clients).map((config) => {
        // check to see if client is in overuseds list
        if (client == config) client_finished = true;
      });
      Object.keys(database.outdated_clients).map((config) => {
        // check to see if client is in outdateds list
        if (client == config) client_finished = true;
      });

      if (client_finished) continue; // if client is in exceptions list, skip this client

      let timestamp = Date.now(); // get the current time stamp

      let remainingTraffic =
        (
          (clientInfo.totalGB - (clientInfo.up + clientInfo.down)) /
          1024 ** 3
        ).toFixed(2) + "GB"; // show the remaining traffic in traffic+"GB" format

      if (clientInfo.totalGB == 0) remainingTraffic = "unlimited";
      // if total allowed usage is 0 set remainng traffic to "unlimited"
      else if (clientInfo.totalGB <= clientInfo.up + clientInfo.down) {
        // if client exceeds their traffic limit: ...
        for (let index in clientInfo.email) {
          let temp_client = { ...clientInfo }; // get a copy of clients information
          temp_client.email = clientInfo.email[index]; // set the client-copy email to the email saved on the x-ui panel
          temp_client.id = clientInfo.id[index]; // set the client-copy uuid to the uuid saved on the x-ui panel
          temp_client.inbound = clientInfo.inbound[index]; // set the client-copy inbound-id to the inbound-id  saved on the x-ui panel
          temp_client.enable = false; // disable client

          let updateConfig = await updateClient(temp_client); // update client with the new information (disable client)

          if (updateConfig.ok) {
            console.log(client, "was disabled due to overusing traffic");

            database.overused_clients[client] = timestamp; // add the current client to the "over useds" exceptions list

            updateDatabase(); // update local database variable to sync the last data
          }
        }
      }

      if (clientInfo.expiryTime != 0 && clientInfo.expiryTime <= timestamp) {
        // if clients time is limited and is expired
        database.outdated_clients[client] = clientInfo.expiryTime; // add the current client to the "out dateds" exceptions list

        updateDatabase(); // update local database variable to sync the last data
      }

      console.log(client, "has", remainingTraffic, "left");
    }
  } catch (err) {
    logger(err, "ERROR");
  }
}

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
        db.get(
          "SELECT up,down FROM client_traffics WHERE email = ?",
          [email],
          (err, res) => {
            if (err) {
              logger(err, "ERROR");
              reject(err);
            } else {
              if (res) {
                data.up += res.up;
                data.down += res.down;
                resolve("success");
              } else {
                logger("client doesn't exist", "WARN");
                reject("client doesn't exist");
              }
            }
          }
        );
      });
    } catch (err) {
      logger(err, "ERROR");
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
  try {
    for (let inbound of inbound_ids) {
      let inbounds_data = await new Promise((resolve, reject) => {
        db.get(
          "SELECT settings FROM inbounds WHERE id = ?",
          [inbound],
          (err, res) => {
            if (err) {
              logger(err, "WARN");
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
    logger(err, "ERROR");
  }
}

async function changeClientUsage(client) {
  let response;
  let { email, usage } = client;
  try {
    for (let index in email) {
      let traffic = index == 0 ? usage : 0;

      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE client_traffics SET up = 0, down = ? WHERE email = ?",
          [traffic, email[index]],
          (err) => {
            if (err) {
              response = { ok: false, msg: "an unexpected error has occured" };
              reject(err);
              logger(err, "WARN");
            } else {
              resolve("success");
            }
          }
        );
      });
    }

    response = { ok: true, msg: "client usage has updated" };
  } catch (err) {
    logger(err, "ERROR");
    response = { ok: false, msg: "an unexpected error has occured" };
  } finally {
    return response;
  }
}

// update a client in xui panel
async function updateClient(client) {
  let serverResponse;

  try {
    let {
      email,
      id,
      inbound,
      enable,
      totalGB,
      limitIp,
      subId,
      expiryTime,
      tgId,
    } = client;

    serverResponse = await axios({
      method: "post",
      maxBodyLength: Infinity,
      url: `${yamlData.xui.address}:${yamlData.xui.port}/panel/api/inbounds/updateClient/${id}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: database.cookie,
      },
      data: JSON.stringify({
        id: parseInt(inbound),
        settings: JSON.stringify({
          clients: [
            {
              email,
              enable,
              expiryTime,
              id,
              limitIp,
              subId,
              tgId,
              totalGB,
            },
          ],
        }),
      }),
    })
      .then(function (response) {
        if (!response.data.success) {
          setTimeout(() => {
            getCookie();
          }, 2000);

          logger(
            `Error in changing clients' stat: ${email} - id: ${id}: ${response.data.msg}`,
            "WARN"
          );

          return {
            ok: false,
            msg: `Error in changing clients' stat: ${email} - id: ${id}`,
          };
        } else {
          console.log(`Updated clients' stat: ${email} - id: ${id}`);

          return { ok: true, msg: `updated ${email} status` };
        }
      })
      .catch(function (error) {
        logger(error, "WARN");
      });
  } catch (err) {
    logger(err, "WARN");
    serverResponse = { ok: true, msg: err };
  } finally {
    return serverResponse;
  }
}

// remove a client from x-ui panel
async function removeClientFromXUI(id, inbound) {
  let serverResponse;

  try {
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${yamlData.xui.address}:${yamlData.xui.port}/panel/api/inbounds/${inbound}/delClient/${id}`,
      headers: {
        Accept: "application/json",
        "Conetnt-Type": "application/json",
        Cookie: database.cookie,
      },
    };

    await axios(config)
      .then(function (response) {
        if (response.data.success) {
          logger("client deleted from x-ui panel: " + id, "INFO");
          serverResponse = { ok: true, msg: "client deleted from x-ui panel" };
        } else {
          getCookie();
          logger(
            `error in removing client: id - ${id}, msg: ${response.data.msg}`,
            "WARN"
          );

          serverResponse = {
            ok: false,
            msg: "an unexpected error has occured",
          };
        }
      })
      .catch(function (error) {
        logger(error, "WARN");
        serverResponse = {
          ok: false,
          msg: "an unexpected error has occured",
        };
      });
  } catch (err) {
    logger(err, "ERROR");
    serverResponse = {
      ok: false,
      msg: "an unexpected error has occured",
    };
  } finally {
    return serverResponse;
  }
}

// add a client to x-ui panel
async function addClientToXUI(client) {
  let serverResponse;

  try {
    const data = {
      id: parseInt(client.inbound),
      settings: JSON.stringify({
        clients: [
          {
            id: client.id,
            email: client.email,
            limitIp: client.limitIp,
            totalGB: client.totalGB,
            expiryTime: client.expiryTime,
            enable: client.enable,
            tgId: client.tgId,
            subId: client.subId,
          },
        ],
      }),
    };

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${yamlData.xui.address}:${yamlData.xui.port}/panel/api/inbounds/addClient`,
      headers: {
        Accept: "application/json",
        "Conetnt-Type": "application/json",
        Cookie: database.cookie,
      },
      data,
    };

    await axios(config)
      .then(function (response) {
        if (response.data.success) {
          logger("new client added to x-ui panel: " + client.email, "INFO");
          serverResponse = { ok: true, msg: "new client added to x-ui panel" };
        } else {
          getCookie();
          logger(response.data.msg, "WARN");

          serverResponse = {
            ok: false,
            msg: "an unexpected error has occured",
          };
        }
      })
      .catch(function (error) {
        getCookie();

        logger(error, "WARN");
        serverResponse = {
          ok: false,
          msg: "an unexpected error has occured",
        };
      });
  } catch (err) {
    logger(err, "ERROR");
    serverResponse = {
      ok: false,
      msg: "an unexpected error has occured",
    };
  } finally {
    return serverResponse;
  }
}

// receive X-UIs' cookie
async function getCookie() {
  try {
    await axios({
      method: "post",
      maxBodyLength: Infinity,
      url: `${yamlData.xui.address}:${yamlData.xui.port}/login`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        username: yamlData.xui.username,
        password: yamlData.xui.password,
      }),
    })
      .then(function (response) {
        if (response.data.success) {
          let cookie = response.headers["set-cookie"][0];
          database.cookie = cookie;

          updateDatabase();

          logger("received new cookie and stored it in json database", "INFO");
        } else {
          setTimeout(() => {
            getCookie();
            updateDatabase();
          }, 2000);

          logger("Error in recieving cookie, something went wrong", "WARN");
        }
      })
      .catch(function (error) {
        logger(error, "ERROR");
      });
  } catch (err) {
    logger(err, "ERROR");
  }
}

// update local database variable "database"
function loadLocalDatabase() {
  try {
    database = JSON.parse(fs.readFileSync(database_file_path));

    setInterval(() => {
      inboundsLastUpdate++;
    }, 1000);

    console.log("database was loaded successfully");
  } catch (err) {
    logger(err, "ERROR");
  }
}

// load config.yaml file
function loadConfigFile() {
  try {
    yamlData = yaml.load(fs.readFileSync(config_file_path));

    setInterval(() => {
      inboundsLastUpdate++;
    }, 1000);

    console.log("yamlData was loaded successfully");
  } catch (err) {
    console.log("couldn't load config.yaml! please re-run the program");
  }
}

// update database json file
function updateDatabase(failed) {
  try {
    let file_path;
    if (failed) file_path = database_backup_file_path;
    else file_path = database_file_path;

    fs.writeFile(file_path, JSON.stringify(database), (err) => {
      if (err) {
        updateDatabase(true);
        logger(err, "ERROR");
      }
    });
  } catch (err) {
    logger(err, "ERROR");
  }
}

function updateYAMLFile() {
  let response;
  try {
    let yaml_dump = yaml.dump(yamlData);

    fs.writeFile(config_file_path, yaml_dump, (err) => {
      if (err) {
        logger(err, "ERROR");
        response = { ok: false, msg: "an unexpected error has occured" };
      } else {
        response = { ok: true, msg: "config file updated" };
      }
    });

    loadConfigFile();
  } catch (err) {
    logger(err, "ERROR");
    response = { ok: false, msg: "an unexpected error has occured" };
  } finally {
    return response;
  }
}

// create a new hash for passwords
async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  return hash;
}

// compare stored hash with entered password
async function comparePassword(password) {
  try {
    const result = await bcrypt.compare(password, yamlData.accesscode);
    return result;
  } catch (err) {
    logger(err, "ERROR");
    return false;
  }
}

// get the date in this format: YYYY-MM-DD HH:MM:SS
function getCurrentDate() {
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDay()).padStart(2, "0");
  let hour = String(now.getHours()).padStart(2, "0");
  let minute = String(now.getMinutes()).padStart(2, "0");
  let second = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// log everything to log.txt
function logger(err, level) {
  try {
    fs.appendFile(
      log_file_path,
      `[${getCurrentDate()}] ${level}: ${err}\n`,
      (error) => {
        if (error) {
          logger(error, "ERROR");
        } else {
          console.log(err, "See log.txt for full info");
        }
      }
    );
  } catch (err) {
    console.log(err);

    logger(err, "ERROR");
  }
}

app.listen(PORT, console.log("server started on port", PORT));
