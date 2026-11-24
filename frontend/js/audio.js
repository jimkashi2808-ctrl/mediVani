"use strict";

// AudioPlayer: reads text aloud using the voices already installed on the device (free, no key needed).
const AudioPlayer = (() => {
  const synth = window.speechSynthesis;
  const supported = !!synth && "SpeechSynthesisUtterance" in window;
  if (supported) synth.getVoices(); // wakes up the voice list

  function voiceFor(code) {
    const want = code.toLowerCase();
    const base = want.split("-")[0];
    const voices = synth.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase().replace("_", "-") === want) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(base)) ||
      null
    );
  }

  // Returns { ok: true } or { ok: false, reason: "plain-English explanation" }
  function speak(text, code) {
    if (!supported)
      return {
        ok: false,
        reason: "This browser cannot play speech. Try Chrome or Edge.",
      };
    const voice = voiceFor(code);
    if (!voice)
      return {
        ok: false,
        reason: `No voice for this language is installed on this device. Add one in your system's language settings (${code}).`,
      };
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    synth.speak(u);
    return { ok: true };
  }

  function stop() {
    if (supported) synth.cancel();
  }

  return { supported, speak, stop };
})();
