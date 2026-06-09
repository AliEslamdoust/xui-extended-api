const express = require("express");
const router = express.Router();
const clientController = require("../controllers/client-controller");
const systemController = require("../controllers/settings-controller");

router.get("/api/startSync", clientController.startSync);
router.get("/api/stopSync", clientController.stopSync);
router.post("/api/updateClient", clientController.updateClient);
router.post("/api/removeClient", clientController.removeClient);
router.post("/api/addClient", clientController.addClient);
router.post("/api/changeClientUsage", clientController.changeClientUsage);
router.get("/api/getClient/:subId", clientController.getClient);
router.get("/api/getAllClients", clientController.getAllClients);
router.get("/api/getAllSubIds", clientController.getAllSubIds);
router.get("/api/getFinishedClient", clientController.getFinishedClient);
router.post("/api/setDepletedFlag", clientController.setDepletedFlag);
router.get("/api/SIDbyID/:id", clientController.subIdById);
router.get("/api/SIDbyEmail/:email", clientController.subIdByEmail);
router.get("/api/reload", systemController.reload);
router.get("/api/newApiKey", systemController.newAPIKey);
router.get("/api/restartXray", systemController.restartXrayCore);
router.post("/api/changePanelAddress", systemController.changePanelAddress);
router.post("/api/changePanelInbounds", systemController.changePanelInbounds);

module.exports = router;
