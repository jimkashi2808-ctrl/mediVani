"use strict";

// Sends a recorded WAV to the IndicConformer service (backend/asr) and returns the text.
const config = require("../config/config");

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function transcribe(wavBuffer, lang) {
  let res;
  try {
    res = await fetch(
      `${config.asrServiceUrl}/transcribe?lang=${encodeURIComponent(lang)}`,
      {
        method: "POST",
        headers: { "Content-Type": "audio/wav" },
        body: wavBuffer,
      },
    );
  } catch (err) {
    throw fail(
      "The IndicConformer speech service is not running. Start it from the backend/asr folder (see README).",
      502,
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw fail(
      data.detail || "The speech service could not read this audio.",
      res.status === 413 ? 413 : 502,
    );
  return String(data.text || "").trim();
}

module.exports = { transcribe };
