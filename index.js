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

app.listen(PORT, console.log("server started on port", PORT));
