const logger = require("../utils/logger");

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

          logger.info("received new cookie and stored it in json database");
        } else {
          setTimeout(() => {
            getCookie();
            updateDatabase();
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
