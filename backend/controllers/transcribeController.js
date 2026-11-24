"use strict";

const config = require("../config/config");
const { toBaseCode, ASR_SUPPORTED } = require("../utils/languages");
const asrService = require("../services/asrService");

// POST /api/transcribe?lang=hi-IN   body: 16 kHz mono WAV audio   ->   { text }
async function transcribe(req, res, next) {
  try {
    if (!config.asrServiceUrl)
      return res
        .status(503)
        .json({ error: "IndicConformer is not set up yet. See the README." });
    const lang = toBaseCode(req.query.lang);
    if (!lang || !ASR_SUPPORTED.includes(lang))
      return res
        .status(400)
        .json({ error: "IndicConformer does not support this language." });
    const wav = req.body;
    if (!Buffer.isBuffer(wav) || wav.length < 1000)
      return res.status(400).json({ error: "No audio was received." });
    res.json({ text: await asrService.transcribe(wav, lang) });
  } catch (err) {
    next(err);
  }
}

module.exports = { transcribe };
