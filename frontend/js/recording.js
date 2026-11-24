"use strict";

// Recorder: turns the microphone into text.
//  - "indic":   records audio and sends it to AI4Bharat IndicConformer through the backend (Indian languages)
//  - "browser": the browser's built-in speech recognition (used for English, or before IndicConformer is set up)
const Recorder = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecordAudio = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
  const KNOWN_ERRORS = [
    "not-allowed",
    "service-not-allowed",
    "no-speech",
    "audio-capture",
    "network",
    "language-not-supported",
  ];
  const MAX_MS = 60000; // IndicConformer service accepts up to 60 seconds
  let asr = { enabled: false, languages: [] };
  let active = null;

  function configure(cfg) {
    if (cfg) asr = cfg;
  }

  // Which engine will be used for this language? ("indic", "browser" or null)
  function engineFor(code) {
    const base = code.split("-")[0].toLowerCase();
    if (asr.enabled && canRecordAudio && asr.languages.includes(base))
      return "indic";
    return SR ? "browser" : null;
  }

  // callbacks: onText(finalText, interimText), onError(message), onState("transcribing"), onEnd()
  function start(code, cb) {
    const engine = engineFor(code);
    if (!engine) return false;
    if (engine === "browser") return startBrowser(code, cb);
    startIndic(code, cb);
    return true;
  }
  function stop() {
    if (active) active.stop();
  }

  // ---- browser speech recognition ----
  function startBrowser(code, { onText, onError, onEnd }) {
    let finalText = "";
    const rec = new SR();
    rec.lang = code;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal)
          finalText += (finalText ? " " : "") + piece.trim();
        else interim += piece;
      }
      onText(finalText, interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted")
        onError(
          KNOWN_ERRORS.includes(e.error)
            ? e.error
            : `Speech recognition error: ${e.error}`,
        );
    };
    rec.onend = () => {
      active = null;
      onEnd();
    };
    try {
      rec.start();
    } catch (err) {
      return false;
    }
    active = { stop: () => rec.stop() };
    return true;
  }

  // ---- IndicConformer: record audio, convert to 16 kHz WAV, send to the backend ----
  async function startIndic(code, { onText, onError, onState, onEnd }) {
    let stopRequested = false;
    let mr = null;
    active = {
      stop() {
        stopRequested = true;
        if (mr && mr.state === "recording") mr.stop();
      },
    };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      active = null;
      onError(err.name === "NotFoundError" ? "audio-capture" : "not-allowed");
      onEnd();
      return;
    }
    if (stopRequested) {
      stream.getTracks().forEach((t) => t.stop());
      active = null;
      onEnd();
      return;
    }

    const chunks = [];
    mr = new MediaRecorder(stream);
    const timer = setTimeout(() => {
      if (mr.state === "recording") mr.stop();
    }, MAX_MS);
    mr.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    mr.onstop = async () => {
      clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
      active = null;
      onState("transcribing");
      try {
        const wav = await toWav16k(new Blob(chunks, { type: mr.mimeType }));
        if (!wav) onError("no-speech");
        else onText(await Translation.transcribe(wav, code), "");
      } catch (err) {
        onError(
          err.message || "Could not process the recording. Please try again.",
        );
      }
      onEnd();
    };
    mr.start();
  }

  async function toWav16k(blob) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let decoded;
    try {
      decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    } catch (err) {
      throw new Error("Could not read the recording. Please try again.");
    } finally {
      ctx.close();
    }
    if (decoded.duration < 0.3) return null;
    // Re-draw the audio as 16,000 samples per second, one channel (what IndicConformer expects)
    const off = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * 16000),
      16000,
    );
    const src = off.createBufferSource();
    src.buffer = decoded;
    src.connect(off.destination);
    src.start();
    return encodeWav((await off.startRendering()).getChannelData(0), 16000);
  }

  function encodeWav(pcm, rate) {
    const buf = new ArrayBuffer(44 + pcm.length * 2);
    const v = new DataView(buf);
    const text = (at, s) => {
      for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i));
    };
    text(0, "RIFF");
    v.setUint32(4, 36 + pcm.length * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    text(36, "data");
    v.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([buf], { type: "audio/wav" });
  }

  return { configure, engineFor, start, stop };
})();
