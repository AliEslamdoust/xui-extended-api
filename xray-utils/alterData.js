const logger = require("../utils/logger");
const axios = require("axios");
const { getAllSubIds, inbounds, getClientBySubId } = require("./receiveData");
const { database } = require("../db/manager");

// sync all clients with the same subId
async function checkClients() {
  let clients = await getAllSubIds(); // get all subIds

  for (let clientId of clients) {
    let isClientFinished =
      !!database({
        action: "read",
        table_name: "overused_clients",
        subId: clientId,
      }) ||
      !!database({
        action: "read",
        table_name: "outdated_clients",
        subId: clientId,
      });
    if (isClientFinished) continue; // if client is in exceptions list, skip this client

    let clientInfo = await getClientBySubId(clientId); // get clients full information with their subId

    let timestamp = Date.now(); // get the current time stamp

    let remainingTraffic =
      (
        (clientInfo.totalGB - (clientInfo.up + clientInfo.down)) /
        1024 ** 3
      ).toFixed(2) + "GB"; // show the remaining traffic in traffic+"GB" format

    // if total allowed usage is 0 set remainng traffic to "unlimited"
    if (clientInfo.totalGB == 0) remainingTraffic = "unlimited";
    else if (clientInfo.totalGB <= clientInfo.up + clientInfo.down) {
      // if client exceeds their traffic limit disable them

      let temp_client = { ...clientInfo }; // get a copy of clients information

      let isDisabled = false;
      for (let index in clientInfo.email) {
        temp_client.email = clientInfo.email[index]; // set the client-copy email to the email saved on the x-ui panel
        temp_client.id = clientInfo.id[index]; // set the client-copy uuid to the uuid saved on the x-ui panel
        temp_client.inbound = clientInfo.inbound[index]; // set the client-copy inbound-id to the inbound-id  saved on the x-ui panel
        temp_client.enable = false; // disable client

        let updateConfig = await updateClient(temp_client); // update client with the new information (disable client)

        isDisabled = updateConfig.ok;
      }
      if (isDisabled) {
        database({
          action: "insert",
          table_name: "overused_clients",
          subId: clientId,
        }); // add the current client to the "over useds" exceptions list
      }
    }

    if (clientInfo.expiryTime != 0 && clientInfo.expiryTime <= timestamp) {
      // if clients time is limited and is expired
      database({
        action: "insert",
        table_name: "outdated_clients",
        subId: clientId,
      }); // add the current client to the "out dateds" exceptions list
    }
  }
}

async function changeClientUsage(client) {
  let response;
  let { email, usage } = client;
  try {
    for (let index in email) {
      let traffic = index == 0 ? usage : 0;

      await updateClientUsage(traffic, email);
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
  checkClients,
  changeClientUsage,
  updateClient,
  addClientToXUI,
};
