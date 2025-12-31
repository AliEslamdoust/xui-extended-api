const logger = require("../utils/logger");
const axios = require("axios");

// sync all clients with the same subId
async function syncClients() {
  try {
    /* if inbounds are not updated in the last "reload_delay" seconds, update all inbounds information to sync the last data
    p.s.: "reload_delay" is a vaiable that can be edited in config.yaml file */
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
    logger.error(err);
  }
}

async function changeClientUsage(client) {
  let response;
  let { email, usage } = client;
  try {
    for (let index in email) {
      let traffic = index == 0 ? usage : 0;

      await new Promise((resolve, reject) => {
        xui_db.run(
          "UPDATE client_traffics SET up = 0, down = ? WHERE email = ?",
          [traffic, email[index]],
          (err) => {
            if (err) {
              response = { ok: false, msg: "an unexpected error has occured" };
              reject(err);
              logger.warn(err);
            } else {
              resolve("success");
            }
          }
        );
      });
    }

    response = { ok: true, msg: "client usage has updated" };
  } catch (err) {
    logger.error(err);
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

          logger.warn(
            `Error in changing clients' stat: ${email} - id: ${id}: ${response.data.msg}`
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
        logger.warn(error);
      });
  } catch (err) {
    logger.warn(err);
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
          logger.info("client deleted from x-ui panel: " + id);
          serverResponse = { ok: true, msg: "client deleted from x-ui panel" };
        } else {
          getCookie();
          logger.warn(
            `error in removing client: id - ${id}, msg: ${response.data.msg}`
          );

          serverResponse = {
            ok: false,
            msg: "an unexpected error has occured",
          };
        }
      })
      .catch(function (error) {
        logger.warn(error);
        serverResponse = {
          ok: false,
          msg: "an unexpected error has occured",
        };
      });
  } catch (err) {
    logger.error(err);
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
          logger.info("new client added to x-ui panel: " + client.email);
          serverResponse = { ok: true, msg: "new client added to x-ui panel" };
        } else {
          getCookie();
          logger.warn(response.data.msg);

          serverResponse = {
            ok: false,
            msg: "an unexpected error has occured",
          };
        }
      })
      .catch(function (error) {
        getCookie();

        logger.warn(error);
        serverResponse = {
          ok: false,
          msg: "an unexpected error has occured",
        };
      });
  } catch (err) {
    logger.error(err);
    serverResponse = {
      ok: false,
      msg: "an unexpected error has occured",
    };
  } finally {
    return serverResponse;
  }
}

module.exports = {
  syncClients,
  changeClientUsage,
  updateClient,
  addClientToXUI,
};
