const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const logger = require("./utils/logger");
const { yamlData, database, PORT } = require("./db/manager");
const router = require("./routes/main");
const { getAllInbounds } = require("./xray-utils/receiveData");

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


app.listen(PORT, console.log("server started on port", PORT));
