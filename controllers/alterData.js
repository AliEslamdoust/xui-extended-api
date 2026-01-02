const logger = require("../utils/logger");
const axios = require("axios");
const { getAllClients } = require("./receiveData");
const { database } = require("../db/manager");
const { getData, addData, getAllData } = require("../db/crud.db");

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
