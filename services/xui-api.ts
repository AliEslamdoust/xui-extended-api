const axios = require("axios");
const logger = require("../utils/logger");
const { getCookie } = require("../db/local");
const { refreshCookie } = require("./xuiAuth");
const { getConfig } = require("../config");

// update a client in xui panel
async function updateClient(client) {
    const config = getConfig()
    const cookie = await getCookie()

    const {
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

    return await axios({
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.xui.address}:${config.xui.port}/panel/api/inbounds/updateClient/${id}`,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: cookie
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
                refreshCookie();

                logger.error(
                    `Error in changing clients' stat: ${email} - id: ${id}: ${response.data.msg}`
                );

                return { ok: false, msg: `Error in changing clients' stat: ${email} - id: ${id}` };

            } else {
                logger.info(`Updated clients' stat: ${email} - id: ${id}`);

                return { ok: true, msg: `Updated clients' stat: ${email} - id: ${id}` }
            }
        })
        .catch(function (e) {
            logger.error(e);

            return { ok: false, msg: e.message || e }
        });
}

// remove a client from x-ui panel
async function removeClientFromXUI(id, inbound) {
    const config = getConfig();
    const cookie = await getCookie()

    const c = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.xui.address}:${config.xui.port}/panel/api/inbounds/${inbound}/delClient/${id}`,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: cookie,
        },
    };

    return await axios(c)
        .then(function (r) {
            if (r.data.success) {
                logger.info(`client deleted from x-ui panel: ${id}`);
                return { ok: true, msg: "client deleted from x-ui panel" };
            } else {
                refreshCookie();
                logger.warn(
                    `error in removing client: id - ${id}, msg: ${r.data.msg}`
                );

                return {
                    ok: false,
                    msg: r.data.msg || "an unexpected error has occured",
                };
            }
        })
        .catch(function (e) {
            logger.error(e);
            return {
                ok: false,
                msg: e.message || e,
            };
        });
}

// add a client to x-ui panel
async function addClientToXUI(client) {
    const config = getConfig()
    const cookie = await getCookie()

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

    const c = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.xui.address}:${config.xui.port}/panel/api/inbounds/addClient`,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: cookie,
        },
        data,
    };

    return await axios(c)
        .then(function (res) {
            if (res.data.success) {
                logger.info("new client added to x-ui panel: " + client.email);

                return { ok: true, msg: "new client added to x-ui panel" };
            } else {
                refreshCookie();
                logger.error(`error in adding client: id - ${client.id}, msg: ${res.data.msg}`);

                return {
                    ok: false,
                    msg: res.data.msg || "an unexpected error has occured",
                };
            }
        })
        .catch(function (e) {
            logger.error(e);
            return {
                ok: false,
                msg: e.message || e,
            };
        });
}

// restart xray-core service in x-ui panel
async function restartXray() {
    const config = getConfig();
    const cookie = await getCookie()

    const c = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${config.xui.address}:${config.xui.port}/server/restartXrayService`,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: cookie,
        },
    };

    try {
        const res = await axios(c)

        if (res.data.success) {
            logger.info("xray-core restarted");
            return { ok: true };
        } else {
            logger.warn(`Failed to restart Xray: ${res.data.msg}`);

            refreshCookie();

            return { ok: false, msg: res.data.msg };
        }
    } catch (e) {
        const errorMsg = e.response?.data?.msg || e.message;
        logger.error(`Error restarting Xray: ${errorMsg}`);
        return { ok: false, msg: errorMsg };
    }
}

module.exports = {
    updateClient,
    removeClientFromXUI,
    addClientToXUI,
    restartXray
}