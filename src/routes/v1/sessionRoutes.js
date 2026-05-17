const express = require("express");
const router = express.Router();

const sessionController = require("../../controllers/sessionController");
const { protect } = require("../../middleware/auth");

router.use(protect);

router.get("/today", sessionController.getTodaySession);

module.exports = router;
