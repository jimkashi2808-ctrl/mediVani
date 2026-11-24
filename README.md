# MediVaani

Voice-first communication assistant for patients and doctors who speak different Indian languages.

## 1. Quick start (works with no keys)

1. Install Node.js 18 or newer from https://nodejs.org
2. In a terminal, open the `backend` folder and run:
   ```
   npm install
   npm start
   ```
3. Open **http://localhost:3000** in Chrome or Edge and allow the microphone.

Without any setup, speech uses the browser's built-in recognition and translation uses MyMemory (free).

## 2. Add your keys and real engines

Copy `backend/.env.example` to a new file `backend/.env`, then fill it in. `.env` is private and ignored by Git.

### Speech to text: AI4Bharat IndicConformer

IndicConformer is free and open, but it has no ready-made hosted API, so you run it yourself:

1. Make a free account at https://huggingface.co, open https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual and accept the conditions.
2. In Hugging Face settings, create a **read** access token and paste it as `HF_TOKEN` in `backend/.env`.
3. Install Python 3.10 or newer. In a second terminal:
   ```
   cd backend/asr
   pip install -r requirements.txt
   python -m uvicorn server:app --port 8001
   ```
   The first start downloads the model (large), so wait for "IndicConformer is ready."
4. Restart `npm start`. The mic page now says "Speech engine: AI4Bharat IndicConformer".

It supports the Indian languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada). It does **not** support English, so the browser engine is used when the doctor speaks English.

### Translation: Ollama (local AI, no key)

1. Install Ollama from https://ollama.com
2. Run `ollama pull gemma3:4b` (or any model you prefer, then set `OLLAMA_MODEL`)
3. Keep `TRANSLATION_PROVIDER=ollama` in `backend/.env` and restart `npm start`.

Local models can make mistakes in Indian languages. Always check translations before medical decisions.

## Login

The login page is a name screen only (no password, nothing sent to the server). Ollama is not a login system.

## Not built yet

Medicine information capture and bilingual consultation summaries.

More details: `docs/PROJECT_OVERVIEW.md`, `docs/API_DOCUMENTATION.md`.
