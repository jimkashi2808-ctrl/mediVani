"use strict";

// Translation: talks to the MediVaani backend (translation, speech-to-text and settings).
const Translation = (() => {
  // If the page is opened from the backend (http://localhost:3000) use a relative address, otherwise point at it.
  const API_BASE = location.port === "3000" ? "" : "http://localhost:3000";
  const NO_SERVER =
    "Cannot reach the MediVaani server. Start it with “npm start” inside the backend folder.";

  async function call(path, options) {
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, options);
    } catch (err) {
      throw new Error(NO_SERVER);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  async function translate(text, from, to) {
    const data = await call("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, from, to }),
    });
    return data.translatedText;
  }

  // Sends a 16 kHz WAV recording to IndicConformer and returns the transcript.
  async function transcribe(wavBlob, langCode) {
    const data = await call(
      `/api/transcribe?lang=${encodeURIComponent(langCode)}`,
      {
        method: "POST",
        headers: { "Content-Type": "audio/wav" },
        body: wavBlob,
      },
    );
    return data.text;
  }

  // Which engines the backend has ready. Returns null if the server is not running.
  async function config() {
    try {
      return await call("/api/config");
    } catch (err) {
      return null;
    }
  }

  return { translate, transcribe, config };
})();
