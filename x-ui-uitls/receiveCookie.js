
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