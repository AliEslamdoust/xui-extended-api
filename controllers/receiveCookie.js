const logger = require("../utils/logger");
const axios = require("axios");
const { updateDatabase, getConfig } = require("../db/manager");

// receive X-UIs' cookie
async function getCookie() {
  try {
    let yamlData = getConfig();

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

          updateDatabase({ isCookie: true, cookie });

          logger.info("received new cookie and stored it in json database");
        } else {
          setTimeout(() => {
            getCookie();
            updateDatabase(true);
          }, 2000);

          logger.warn("Error in recieving cookie, something went wrong");
        }
      })
      .catch(function (error) {
        logger.error(error);
      });
  } catch (err) {
    logger.error(err);
  }
}

module.exports = getCookie;
