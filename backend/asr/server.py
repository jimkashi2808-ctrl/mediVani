"""MediVaani speech-to-text service using AI4Bharat IndicConformer.

Run from this folder:   python -m uvicorn server:app --port 8001
Reads settings (HF_TOKEN etc.) from ../.env
"""
import io
import os
import wave
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from starlette.concurrency import run_in_threadpool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MODEL_ID = os.getenv("ASR_MODEL_ID", "ai4bharat/indic-conformer-600m-multilingual")
HF_TOKEN = os.getenv("HF_TOKEN") or None   # your Hugging Face token (the "secret key")
DECODING = os.getenv("ASR_DECODING", "ctc")  # "ctc" or "rnnt"
MAX_SECONDS = 60
# The 22 languages IndicConformer-600M-Multi supports
SUPPORTED = {"as", "bn", "brx", "doi", "gu", "hi", "kn", "kok", "ks", "mai", "ml", "mni", "mr", "ne",
             "or", "pa", "sa", "sat", "sd", "ta", "te", "ur"}

state = {"model": None}


def load_model():
    from transformers import AutoModel  # imported here so the file loads fast

    return AutoModel.from_pretrained(MODEL_ID, trust_remote_code=True, token=HF_TOKEN)


@asynccontextmanager
async def lifespan(app):
    print(f"Loading {MODEL_ID} ... the first start downloads the model and can take a while.")
    state["model"] = load_model()
    print("IndicConformer is ready.")
    yield


app = FastAPI(title="MediVaani speech service", lifespan=lifespan)


def wav_to_samples(data: bytes) -> np.ndarray:
    """The browser sends 16 kHz, mono, 16-bit WAV. Turn it into numbers between -1 and 1."""
    try:
        with wave.open(io.BytesIO(data)) as w:
            if w.getnchannels() != 1 or w.getsampwidth() != 2 or w.getframerate() != 16000:
                raise ValueError("Audio must be 16 kHz, mono, 16-bit WAV.")
            frames = w.readframes(w.getnframes())
    except (wave.Error, EOFError) as err:
        raise ValueError("This is not a valid WAV file.") from err
    return np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0


def run_model(samples: np.ndarray, lang: str) -> str:
    import torch

    wav = torch.from_numpy(samples).unsqueeze(0)
    with torch.inference_mode():
        out = state["model"](wav, lang, DECODING)
    if isinstance(out, (list, tuple)):
        out = out[0] if out else ""
    return str(out).strip()


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID, "loaded": state["model"] is not None}


@app.post("/transcribe")
async def transcribe(request: Request, lang: str):
    if lang not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Language '{lang}' is not supported.")
    try:
        samples = wav_to_samples(await request.body())
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    if len(samples) > MAX_SECONDS * 16000:
        raise HTTPException(status_code=413, detail="Audio is too long (maximum 60 seconds).")
    if len(samples) < 1600:
        raise HTTPException(status_code=400, detail="Audio is too short.")
    text = await run_in_threadpool(run_model, samples, lang)
    return {"text": text}