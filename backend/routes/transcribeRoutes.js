"use strict";

const express = require("express");
const config = require("../config/config");
const { transcribe } = require("../controllers/transcribeController");

const router = express.Router();
router.post(
  "/",
  express.raw({ type: () => true, limit: config.maxAudioBytes }),
  transcribe,
);

module.exports = router;
