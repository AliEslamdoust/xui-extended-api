const { reloadConfig, getConfig, updateConfig } = require("../config");
const { restartXray } = require("../services/xuiApi");
const { generateApiKey } = require("../utils/securityUtils");

// reload config.yaml
exports.reload = async (req, res) => {
    reloadConfig();
    res.json({ ok: true, msg: "reloaded successfully" });
}

// new api key
exports.newPassword = async (req, res) => {
    const { key, hash } = generateApiKey();

    let config = getConfig()
    config.API_KEY = hash;
    updateConfig(config);

    res.json({ ok: true, msg: "Created a new API Key.", apiKey: key });
}

// request for restarting xray core
exports.restartXrayCore = async (req, res) => {
    await restartXray();

    res.json({ ok: true, msg: "xray core restarted successfully" });
}