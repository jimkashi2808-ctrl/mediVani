# MediVaani – Project Overview

## Goal

Help patients and doctors who speak different Indian languages understand each other, using voice first.

## Folder map

| Folder / file                       | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `frontend/index.html`               | The page                                                             |
| `frontend/css/style.css`            | Look and responsive layout                                           |
| `frontend/js/app.js`                | Connects everything and updates the screen                           |
| `frontend/js/recording.js`          | Microphone → text (IndicConformer via backend, or browser fallback)  |
| `frontend/js/translation.js`        | Sends text to the backend for translation                            |
| `frontend/js/audio.js`              | Reads text aloud (browser speech synthesis)                          |
| `backend/server.js`                 | Starts the server, serves the frontend                               |
| `backend/routes/`                   | Maps web addresses to controllers                                    |
| `backend/controllers/`              | Checks the request and sends the reply                               |
| `backend/services/`                 | Talks to outside services (MyMemory, Ollama, IndicConformer service) |
| `backend/asr/`                      | Python speech service that runs AI4Bharat IndicConformer             |
| `backend/.env.example`              | Template for your private settings and keys                          |
| `backend/middleware/`               | Shared error handling                                                |
| `backend/config/`, `backend/utils/` | Settings and small helpers (language list)                           |
| `backend/uploads/`                  | Reserved for future audio uploads (unused now)                       |

## Services used

| Need           | Service                                                                                                                     | Cost                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Speech to text | AI4Bharat IndicConformer (self-hosted, needs a free Hugging Face token); browser Web Speech API as fallback and for English | Free                                           |
| Translation    | Ollama (local, default once `.env` is set) or MyMemory (no setup)                                                           | Free; quality varies, so always check          |
| Audio playback | Browser speech synthesis                                                                                                    | Free, needs a voice installed for the language |

## Safety rules

- The original transcript is never modified. Edits are made on a separate copy.
- Translations are machine-made and must be checked before medical decisions.

## Next

Medicine information capture, bilingual consultation summary, stronger translation provider.
