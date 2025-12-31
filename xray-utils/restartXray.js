const logger = require("../utils/logger");
const axios = require("axios");

async function restartXray() {
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${yamlData.xui.address}:${yamlData.xui.port}/server/restartXrayService`,
    headers: {
      Accept: "application/json",
      "Conetnt-Type": "application/json",
      Cookie: database.cookie,
    },
  };

  await axios(config)
    .then(function (response) {
      if (response.data.success) {
        logger.info("xray-core restarted");
      } else {
        getCookie();
        logger.error(response.data.msg);

        throw new Error(response.data.msg);
      }
    })
    .catch(function (error) {
      logger.error(error);

      throw new Error(error);
    });
}

export default restartXray;
