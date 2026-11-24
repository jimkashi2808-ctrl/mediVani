"use strict";

require("dotenv").config(); // reads optional settings from backend/.env

module.exports = {
  port: process.env.PORT || 3000,
  maxTextLength: 2000, // longest text accepted per request (characters)
  myMemoryEmail: process.env.MYMEMORY_EMAIL || "", // optional: a real email raises MyMemory's free daily limit

  // Translation engine: "mymemory" (default, no setup) or "ollama" (local AI model on your computer)
  translationProvider: (
    process.env.TRANSLATION_PROVIDER || "mymemory"
  ).toLowerCase(),
  ollamaUrl: (process.env.OLLAMA_URL || "http://localhost:11434").replace(
    /\/$/,
    "",
  ),
  ollamaModel: process.env.OLLAMA_MODEL || "gemma3:4b",

  // Speech-to-text: address of the IndicConformer service in backend/asr. Empty = not set up yet.
  asrServiceUrl: (process.env.ASR_SERVICE_URL || "").replace(/\/$/, ""),
  maxAudioBytes: 10 * 1024 * 1024,
};
