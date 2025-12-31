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
        logger("xray-core restarted", "INFO");
      } else {
        getCookie();
        logger(response.data.msg, "ERROR");

        throw new Error(response.data.msg);
      }
    })
    .catch(function (error) {
      logger(error, "ERROR");

      throw new Error(error);
    });
}

export default restartXray;