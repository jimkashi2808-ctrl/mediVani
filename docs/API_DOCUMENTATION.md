# MediVaani – API

Base address (local): `http://localhost:3000`

## GET /api/health

Returns `{ "status": "ok" }`.

## POST /api/translate

Translates text between supported languages.

Request body (JSON):

```json
{ "text": "मुझे बुखार है", "from": "hi-IN", "to": "en-IN" }
```

Language codes may be `hi-IN` or just `hi`. Supported: hi, bn, mr, te, ta, gu, ur, kn, en.

Success (200):

```json
{ "translatedText": "I have a fever" }
```

Errors (JSON `{ "error": "..." }`):
| Status | Meaning |
|---|---|
| 400 | Empty text, text over 2000 characters, or unsupported language |
| 429 | Free translation limit reached for today |
| 502 | Translation service could not be reached |
| 500 | Unexpected server error |

If `from` and `to` are the same language, the text is returned unchanged.

## Optional settings (`backend/.env`)

```
PORT=3000
MYMEMORY_EMAIL=you@example.com   # raises the free daily limit
```

## GET /api/config

Tells the frontend which engines are ready. Never contains secrets.

```json
{
  "asr": {
    "enabled": true,
    "engine": "AI4Bharat IndicConformer",
    "languages": ["hi", "bn", "mr", "te", "ta", "gu", "ur", "kn"]
  },
  "translation": "ollama"
}
```

## POST /api/transcribe?lang=hi-IN

Body: raw WAV audio (16 kHz, mono, 16-bit), `Content-Type: audio/wav`, up to 10 MB / 60 seconds.
Success (200): `{ "text": "..." }`
Errors: 400 (no audio, language not supported by IndicConformer, e.g. English), 502 (speech service not running), 503 (`ASR_SERVICE_URL` not set).

## Translation engine

`TRANSLATION_PROVIDER` in `backend/.env`: `mymemory` (default) or `ollama` (uses `OLLAMA_URL` and `OLLAMA_MODEL`).
