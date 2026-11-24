"use strict";

// Translation: MyMemory (free, no signup) by default, or Ollama when TRANSLATION_PROVIDER=ollama in .env.
const config = require("../config/config");
const ollamaService = require("./ollamaService");

const MAX_BYTES = 400; // MyMemory accepts about 500 bytes per request; Indian scripts use 3 bytes per letter

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Cut long text into pieces small enough for the service, preferring sentence ends.
function splitIntoChunks(text) {
  const sentences = text.split(/(?<=[.!?।۔])\s+/);
  const chunks = [];
  let current = "";
  const push = (piece) => {
    const joined = current ? `${current} ${piece}` : piece;
    if (Buffer.byteLength(joined) <= MAX_BYTES) {
      current = joined;
      return;
    }
    if (current) chunks.push(current);
    current = piece;
  };
  for (const s of sentences) {
    if (Buffer.byteLength(s) <= MAX_BYTES) {
      push(s);
      continue;
    }
    for (const word of s.split(/\s+/)) push(word); // one very long sentence: split by words
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(text, from, to) {
  const params = new URLSearchParams({ q: text, langpair: `${from}|${to}` });
  if (config.myMemoryEmail) params.set("de", config.myMemoryEmail);

  let res;
  try {
    res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
  } catch (err) {
    throw fail(
      "The translation service could not be reached. Check your internet connection.",
      502,
    );
  }
  if (!res.ok)
    throw fail(
      "The translation service is not available right now. Please try again.",
      502,
    );

  const data = await res.json();
  const out = data && data.responseData && data.responseData.translatedText;
  if (
    Number(data.responseStatus) !== 200 ||
    !out ||
    /^MYMEMORY WARNING/i.test(out)
  ) {
    throw fail(
      "The free translation limit may be used up for today. Please try again later.",
      429,
    );
  }
  return out;
}

async function translate(text, from, to) {
  if (config.translationProvider === "ollama")
    return ollamaService.translate(text.trim(), from, to);
  const parts = [];
  for (const chunk of splitIntoChunks(text.trim()))
    parts.push(await translateChunk(chunk, from, to));
  return parts.join(" ");
}

module.exports = { translate, splitIntoChunks };
