"use strict";

const config = require("../config/config");
const { toBaseCode } = require("../utils/languages");
const translationService = require("../services/translationService");

// POST /api/translate   body: { text, from, to }   ->   { translatedText }
async function translate(req, res, next) {
  try {
    const { text, from, to } = req.body || {};
    const source = toBaseCode(from);
    const target = toBaseCode(to);

    if (typeof text !== "string" || !text.trim())
      return res
        .status(400)
        .json({ error: "Please provide some text to translate." });
    if (text.length > config.maxTextLength)
      return res.status(400).json({
        error: `Text is too long (maximum ${config.maxTextLength} characters).`,
      });
    if (!source || !target)
      return res
        .status(400)
        .json({ error: "One of the languages is not supported." });
    if (source === target) return res.json({ translatedText: text });

    const translatedText = await translationService.translate(
      text,
      source,
      target,
    );
    res.json({ translatedText });
  } catch (err) {
    next(err);
  }
}

module.exports = { translate };
