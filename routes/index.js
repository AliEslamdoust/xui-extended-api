const express = require("express");
const router = express.Router();
const clientController = require("../controllers/client-controller");
const systemController = require("../controllers/settings-controller");

// --- Client Management ---
router.post("/api/client", clientController.addClient);
router.put("/api/client", clientController.updateClient);
router.delete("/api/client", clientController.removeClient);
router.get("/api/client/:subId", clientController.getClient);
router.get("/api/clients/all", clientController.getAllClients);

// --- Client Lookup Hooks ---
router.get("/api/clients/sub-ids", clientController.getAllSubIds);
router.get("/api/clients/depleted", clientController.getFinishedClient);
router.post("/api/clients/depleted-flag", clientController.setDepletedFlag);
router.get("/api/clients/sid-by-id/:id", clientController.subIdById);
router.get("/api/clients/sid-by-email/:email", clientController.subIdByEmail);
router.post("/api/clients/usage", clientController.changeClientUsage);

// --- Synchronization Engine ---
router.get("/api/sync/start", clientController.startSync);
router.get("/api/sync/stop", clientController.stopSync);

// --- System Administration ---
router.get("/api/system/reload", systemController.reload);
router.get("/api/system/new-api-key", systemController.newAPIKey);
router.get("/api/system/restart-xray", systemController.restartXrayCore);
router.post("/api/system/panel-address", systemController.changePanelAddress);
router.post("/api/system/panel-inbounds", systemController.changePanelInbounds);

module.exports = router;