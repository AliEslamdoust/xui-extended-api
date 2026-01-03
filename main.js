const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const logger = require("./utils/logger");
const router = require("./routes/main");
const { getConfig } = require("./config");
const { comparePassword } = require("./utils/securityUtils");

const PORT = getConfig().port;

app.use((req, res, next) => {
  const accesscode = req.headers.accesscode;
  let compareKey = comparePassword(accesscode);

  if (!compareKey) {
    res.json({ ok: false, msg: "Invalid access code!" });
    return;
  }

  next();
});

app.use((err, res) => {
  logger.error(err.stack);

  res
    .status(err.statusCode || 500)
    .json({ ok: false, msg: err.message || "An unexpected error has occured" });
});

app.use(bodyParser.json());
app.use(express.json());
app.use("", router);

app.listen(PORT, logger.info("server started on port", PORT));
