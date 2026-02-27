const logger = require("../utils/logger");
const { updateClientUsage } = require("../db/xui");

// change a clients usage in xui database
async function changeClientUsageInXUI(client) {
    let { email, usage } = client;
    if (!Array.isArray(email)) email = [email];

    for (let i = 0; i < email.length; i++) {
        let traffic = (i === 0) ? usage : 0;

        try {
            await updateClientUsage(email[i], traffic);
        } catch (err) {
            logger.error(`Failed to update usage for ${email[i]}: ${err}`);
        }
    }

    return { ok: true, msg: "client usage has updated" };

}


module.exports = {
    changeClientUsageInXUI,
};
