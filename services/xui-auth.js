const logger = require("../utils/logger");
const axios = require("axios");
const { updateCookie } = require("../db/local-queries");
const { getConfig } = require("../config");

// receive X-UIs' cookie
async function refreshCookie() {
  try {
    let config = getConfig();

    let res = await axios({
      method: "post",
      maxBodyLength: Infinity,
      url: `${config.xui.address}/login`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        username: process.env.xui.username,
        password: process.env.xui.password,
      }),
    });

    if (res.data.success) {
      const cookies = res.headers["set-cookie"];

      if (cookies && cookies.length > 0) {
        const newCookie = cookies[0];

        await updateCookie(newCookie);

        logger.info("Login successful: Received new cookie and stored it.");
        return newCookie;
      } else {
        logger.warn("Login successful, but server sent no Set-Cookie header.");
      }
    } else {
      logger.warn(
        res.data.msg || "Login failed: Server returned success=false"
      );
    }
  } catch (err) {
    const errMsg = err.response?.data?.msg || err.message;
    logger.error("Failed to refresh cookie: " + errMsg);
  }
}

module.exports = { refreshCookie };
