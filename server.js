const express = require("express");
const bodyParser = require("body-parser");
const logger = require("./utils/logger");
const router = require("./routes/index");
const { validateApiKey } = require("./utils/auth");

const PORT = Number(process.env.PORT) || 5594;

const app = express();

app.use((req, res, next) => {
  const API_KEY = req.headers.API_KEY;
  let compareKey = validateApiKey(API_KEY);

  if (!compareKey) {
    res.json({ ok: false, msg: "Invalid access code!" });
    return;
  }

  next();
});

app.use(bodyParser.json());
app.use(express.json());
app.use("", router);

app.use((err, req, res, next) => {
  logger.error(err.stack);

  res
    .status(err.statusCode || 500)
    .json({ ok: false, msg: err.message || "An unexpected error has occured" });
});

app.listen(PORT, () => logger.info(`server started on port ${PORT}`));
