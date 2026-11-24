"use strict";

// Languages MediVaani supports. Add a new line here when you add a language in the frontend.
const NAMES = {
  hi: "Hindi",
  bn: "Bengali",
  mr: "Marathi",
  te: "Telugu",
  ta: "Tamil",
  gu: "Gujarati",
  ur: "Urdu",
  kn: "Kannada",
  en: "English",
};
const SUPPORTED = Object.keys(NAMES);

// IndicConformer covers the 22 official Indian languages, but not English.
const ASR_SUPPORTED = SUPPORTED.filter((c) => c !== "en");

// "hi-IN" -> "hi". Returns null if the language is not supported.
function toBaseCode(code) {
  if (typeof code !== "string") return null;
  const base = code.split(/[-_]/)[0].toLowerCase();
  return SUPPORTED.includes(base) ? base : null;
}

module.exports = { NAMES, SUPPORTED, ASR_SUPPORTED, toBaseCode };
