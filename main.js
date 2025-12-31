const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const logger = require("./utils/logger");
const { PORT } = require("./db/manager");
const router = require("./routes/main");
const { getAllInbounds } = require("./xray-utils/receiveData");

app.use((err, req, res, next) => {
  logger.error(err.stack);

  res
    .status(err.statusCode || 500)
    .json({ ok: false, msg: err.message || "An unexpected error has occured" });
});

app.use(bodyParser.json());
app.use(express.json());
app.use("/", router);

let localInbounds = getAllInbounds(); // get all inbounds from xui database

// API

// a function to restart the xray core when it's called

let interval;
function startInterval(time) {
  clearInterval(interval);

  syncClients();
  interval = setInterval(() => {
    syncClients();
  }, time);
}

function stopInterval() {
  clearInterval(interval);
}

app.listen(PORT, logger.info("server started on port", PORT));
