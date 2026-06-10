const { reloadConfig, getConfig, updateConfig } = require("../config");
const { restartXray } = require("../services/xui-api");
const { refreshCookie } = require("../services/xui-auth");
const { generateApiKey } = require("../utils/auth");

// reload config.yaml
exports.reload = async (req, res) => {
  reloadConfig();
  res.json({ ok: true, msg: "reloaded successfully" });
};

// new api key
exports.newAPIKey = async (req, res) => {
  const { key, hash } = generateApiKey();

  let config = getConfig();
  config.API_KEY = hash;
  updateConfig(config);

  res.json({ ok: true, msg: "Created a new API Key.", apiKey: key });
};

// request for restarting xray core
exports.restartXrayCore = async (req, res) => {
  await restartXray();

  res.json({ ok: true, msg: "xray core restarted successfully" });
};

// change x-ui panel address
exports.changePanelAddress = async (req, res) => {
  const { newAddress } = req.body;
  const regex = /^https?:\/\/([a-zA-Z0-9.-]+):(\d+)$/;

  if (
    !newAddress ||
    typeof newAddress !== "string" ||
    !regex.test(newAddress)
  ) {
    res.json({
      ok: false,
      msg: "Invalid address format. It must start with http or https and include a port number. accepted formats: http://localhost:54321 or https://yourdomain.com:54321",
    });
    return;
  }

  let config = getConfig();
  config.xui.address = newAddress;
  updateConfig(config);

  refreshCookie();

  res.json({ ok: true, msg: "X-UI panel address updated successfully." });
};

// change x-ui panel inbounds
exports.changePanelInbounds = async (req, res) => {
  const { newInbounds } = req.body;

  if (
    !Array.isArray(newInbounds) ||
    !newInbounds.every(
      (id) => Number.isInteger(id) && id > 0
    )
  ) {
    res.json({
      ok: false,
      msg: "Invalid inbounds format. It must be an array of valid port numbers (integers must be greater than 0).",
    });
    return;
  }

  let config = getConfig();
  config.xui.inbounds = newInbounds;
  updateConfig(config);

  res.json({ ok: true, msg: "X-UI panel inbounds updated successfully." });
}
