# MediVaani — Voice-first healthcare communication

MediVaani helps a patient and a doctor communicate when they speak different languages. It is designed as a shared-device, turn-by-turn conversation flow: choose each person's language, speak or type, review the transcript, translate, and play the translated message aloud.

> **Important:** MediVaani is a prototype, not a medical device or a certified medical interpreter. AI translation and speech recognition can make mistakes. A clinician must confirm diagnoses, medicine names, doses, timings, and other medical instructions before anyone acts on them. Do not use real patient information in a public demo.

## Features

- Patient and doctor language selection.
- Voice or text input.
- Editable transcript before translation.
- Translation through a local Ollama model.
- Optional AI4Bharat IndicConformer speech recognition.
- Text-to-speech using voices available on the user's device.
- Turn-by-turn conversation flow.

## Technology

- Frontend: HTML, CSS and vanilla JavaScript.
- Backend: Node.js and Express.
- Translation: Ollama or optional MyMemory provider.
- Optional speech recognition: Python, FastAPI and AI4Bharat IndicConformer.
- Text-to-speech: Browser Web Speech API.

Languages shown in the current interface: Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada and English (India). Actual recognition, translation and voice quality varies by engine and device.

## Project structure

```text
mediVani/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       ├── recording.js
│       ├── translation.js
│       └── audio.js
├── backend/
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── asr/
│   ├── package.json
│   └── .env.example
├── docs/
└── README.md
```

## Requirements

- Node.js 18 or newer.
- Ollama installed locally.
- A computer with enough memory and disk space for the selected model.
- Chrome or Edge recommended for testing browser speech features.

## Run MediVaani with Ollama

### 1. Install backend dependencies

Open a terminal in the project root:

```bash
cd backend
npm install
```

### 2. Create your environment file

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Use these settings in `backend/.env`:

```env
PORT=3000
TRANSLATION_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
ASR_SERVICE_URL=
```

Do not commit or share `backend/.env`. Never put API tokens or credentials in source code, README files, screenshots or GitHub.

### 3. Download the Ollama model

```bash
ollama pull gemma3:4b
```

Make sure the Ollama desktop app or service is running. Check installed models with:

```bash
ollama list
```

If Ollama is not running, start it in a separate terminal:

```bash
ollama serve
```

### 4. Start the backend

From the `backend` folder:

```bash
npm start
```

Open the application:

http://localhost:3000

Allow microphone access when your browser asks. You can also use the Write option if speech recognition is unavailable.

### 5. Check backend health

Open:

http://localhost:3000/api/health

Expected response:

```json
{"status":"ok"}
```

## Optional: IndicConformer speech recognition

The project includes an optional FastAPI service in `backend/asr/`. Ollama is used for translation; IndicConformer is used for speech-to-text. You do not need IndicConformer to test typed translation or browser speech recognition.

Install Python 3.10/3.11, create a virtual environment inside `backend/asr`, activate it, and install:

```bash
pip install -r requirements.txt
```

If the Hugging Face model requires authentication, set `HF_TOKEN` in `backend/.env`. Keep it private.

Start the service from `backend/asr`:

```bash
uvicorn server:app --host 127.0.0.1 --port 8001
```

Set this in `backend/.env`:

```env
ASR_SERVICE_URL=http://localhost:8001
```

Restart the Node backend. If the optional service is not installed or running, leave `ASR_SERVICE_URL` blank.

## Translation providers

| Provider | Setting | Notes |
|---|---|---|
| Ollama | `TRANSLATION_PROVIDER=ollama` | Local model; requires local compute and model storage. |
| MyMemory | `TRANSLATION_PROVIDER=mymemory` | Internet-based provider; free limits and availability can change. |

Ollama output is not guaranteed to be medically accurate. Test language pairs with safe sample sentences, especially numbers, negation, allergies, duration and dosage units. Always show the original message and require clinician confirmation.

## API endpoints

- `GET /api/health` — backend health.
- `GET /api/config` — configured translation provider and optional ASR status.
- `POST /api/translate` — accepts `{ "text": "...", "from": "en", "to": "hi" }` and returns `{ "translatedText": "..." }`.
- `POST /api/transcribe?lang=hi-IN` — accepts 16 kHz mono 16-bit WAV audio and returns `{ "text": "..." }`. Requires the optional IndicConformer service.

## Push changes to GitHub

Run these commands from the project root, where the `.git` folder exists:

```bash
git status --short
git add .
git status
git commit -m "Prepare MediVaani voice-first healthcare demo"
git pull --rebase origin main
git push origin main
```

Do not force-push. If Git reports a conflict, resolve it before pushing. Do not delete `.git` or run `git init` in an existing repository.

## Demo checklist

- Start Ollama and confirm the model appears in `ollama list`.
- Start the backend and check `/api/health`.
- Test typed translation for the language pairs you plan to demonstrate.
- Test microphone permission and speech recognition in the actual demo browser.
- Test text-to-speech voices on the demo device.
- Show the original transcript alongside the translation.
- Use fictional sample patient information only.
- State clearly that the doctor must verify medical instructions.

## Limitations

- Listing a language in the interface does not guarantee equal support across all engines.
- Browser speech recognition and speech synthesis depend on browser, operating system, installed voices and internet availability.
- IndicConformer is optional and must be installed separately.
- Local Ollama translation depends on the model's language ability, computer memory and speed.
- MediVaani is a hackathon prototype, not a validated clinical translation system.
