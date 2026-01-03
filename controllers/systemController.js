const { reloadConfig, getConfig, updateConfig } = require("../config");
const { restartXray } = require("../services/xuiApi");
const { hashPassword, comparePassword } = require("../utils/securityUtils");

// reload config.yaml
exports.reload = async (req, res) => {
    reloadConfig();
    res.json({ ok: true, msg: "reloaded successfully" });
}

// change hash passowrd
exports.updatePassword = async (req, res) => {
    const new_password = req.headers.password;

    if (!new_password || new_password.length === 0) {
        return res.status(400).json({ ok: false, msg: "password is required." });
    }
    const isPasswordTheSame = await comparePassword(new_password);
    if (isPasswordTheSame) {
        return res.status(400).json({ ok: false, msg: "new password is the same as the old one." });
    } else if (new_password.length < 8) {
        return res.status(400).json({ ok: false, msg: "password is too short. minimum length is 8 characters." });
    }

    let new_hash = await hashPassword(new_password);

    let config = getConfig()
    config.accesscode = new_hash;
    updateConfig(config);

    res.json({ ok: true, msg: "password updated successfully" });
}

// request for restarting xray core
exports.restartXrayCore = async (req, res) => {
    await restartXray();

    res.json({ ok: true, msg: "xray core restarted successfully" });
}