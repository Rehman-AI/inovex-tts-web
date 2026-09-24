"""
Inovex TTS — FastAPI Backend
Serves the Edge-TTS synthesis API for the web frontend.
"""

from __future__ import annotations

import uuid

import edge_tts
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Inovex TTS API",
    description="Neural Text-to-Speech powered by Edge-TTS",
    version="1.0.0",
)

# CORS — allow the frontend (local + deployed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ────────────────────────────────────────
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice: str = Field(default="en-US-JennyNeural")
    rate_pct: int = Field(default=0, ge=-50, le=50)
    pitch_hz: int = Field(default=0, ge=-50, le=50)


class VoiceInfo(BaseModel):
    name: str
    gender: str
    locale: str
    language: str
    region: str


# ── Endpoints ────────────────────────────────────────────────────────
@app.get("/api/voices", response_model=list[VoiceInfo])
async def list_voices():
    """Return all available Edge-TTS voices."""
    voices = await edge_tts.list_voices()
    result = []
    for v in voices:
        locale = v["Locale"]
        parts = locale.split("-")
        language = parts[0] if parts else locale
        region = parts[1] if len(parts) > 1 else ""
        result.append(VoiceInfo(
            name=v["ShortName"],
            gender=v["Gender"],
            locale=locale,
            language=language,
            region=region,
        ))
    return result


@app.post("/api/synthesize")
async def synthesize(req: SynthesizeRequest):
    """Generate speech audio and return MP3 bytes."""
    rate_str = f"{'+' if req.rate_pct >= 0 else ''}{req.rate_pct}%"
    pitch_str = f"{'+' if req.pitch_hz >= 0 else ''}{req.pitch_hz}Hz"

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=req.voice,
            rate=rate_str,
            pitch=pitch_str,
        )

        # Collect audio bytes in memory (no disk write for web)
        audio_chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        if not audio_chunks:
            raise HTTPException(status_code=500, detail="No audio data generated")

        audio_bytes = b"".join(audio_chunks)

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f'attachment; filename="inovex_tts_{uuid.uuid4().hex[:8]}.mp3"',
                "X-Audio-Size": str(len(audio_bytes)),
            },
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(exc)}")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Inovex TTS API"}
