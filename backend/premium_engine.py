"""
Inovex Studio HD Neural TTS Engine.
Provides high-fidelity, ultra-natural local text-to-speech synthesis
with 54 studio voices across 9 languages/accents.
"""

from __future__ import annotations

import io
import logging
import os
import threading
from typing import Any, Dict, List, Optional

import numpy as np
import soundfile as sf
import torch

logger = logging.getLogger("inovex-tts.studio")

# ── Voice Registry: 54 Inovex Studio Voices ──────────────────────────────
STUDIO_VOICES: List[Dict[str, Any]] = [
    # ── American English (11 Female, 9 Male = 20 voices) ─────────────────
    {"name": "af_heart", "displayName": "Heart (Studio HQ)", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio HQ", "recommended": True, "engine": "studio"},
    {"name": "af_bella", "displayName": "Bella", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "af_nicole", "displayName": "Nicole", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_aoede", "displayName": "Aoede", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_kore", "displayName": "Kore", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_sarah", "displayName": "Sarah", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_nova", "displayName": "Nova", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_sky", "displayName": "Sky", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_alloy", "displayName": "Alloy", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_jessica", "displayName": "Jessica", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "af_river", "displayName": "River", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_adam", "displayName": "Adam", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio HQ", "recommended": True, "engine": "studio"},
    {"name": "am_michael", "displayName": "Michael", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "am_echo", "displayName": "Echo", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_eric", "displayName": "Eric", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_fenrir", "displayName": "Fenrir", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_liam", "displayName": "Liam", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_onyx", "displayName": "Onyx", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_puck", "displayName": "Puck", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "am_santa", "displayName": "Santa", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},

    # ── British English (4 Female, 4 Male = 8 voices) ────────────────────
    {"name": "bf_emma", "displayName": "Emma", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio HQ", "recommended": True, "engine": "studio"},
    {"name": "bf_isabella", "displayName": "Isabella", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "bf_alice", "displayName": "Alice", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "bf_lily", "displayName": "Lily", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "bm_george", "displayName": "George", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio HQ", "recommended": True, "engine": "studio"},
    {"name": "bm_fable", "displayName": "Fable", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "bm_lewis", "displayName": "Lewis", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "bm_daniel", "displayName": "Daniel", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Studio Pro", "recommended": False, "engine": "studio"},

    # ── Spanish (1 Female, 2 Male = 3 voices) ────────────────────────────
    {"name": "ef_dora", "displayName": "Dora", "gender": "Female", "locale": "es-ES", "accent": "Spanish", "language": "Spanish", "region": "ES", "flag": "🇪🇸", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "em_alex", "displayName": "Alex", "gender": "Male", "locale": "es-ES", "accent": "Spanish", "language": "Spanish", "region": "ES", "flag": "🇪🇸", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "em_santa", "displayName": "Santa (ES)", "gender": "Male", "locale": "es-ES", "accent": "Spanish", "language": "Spanish", "region": "ES", "flag": "🇪🇸", "quality": "Studio Pro", "recommended": False, "engine": "studio"},

    # ── French (1 Female = 1 voice) ──────────────────────────────────────
    {"name": "ff_siwis", "displayName": "Siwis", "gender": "Female", "locale": "fr-FR", "accent": "French", "language": "French", "region": "FR", "flag": "🇫🇷", "quality": "Studio HQ", "recommended": False, "engine": "studio"},

    # ── Hindi (2 Female, 2 Male = 4 voices) ──────────────────────────────
    {"name": "hf_alpha", "displayName": "Alpha", "gender": "Female", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "hf_beta", "displayName": "Beta", "gender": "Female", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "hm_omega", "displayName": "Omega", "gender": "Male", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "hm_psi", "displayName": "Psi", "gender": "Male", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},

    # ── Italian (1 Female, 1 Male = 2 voices) ────────────────────────────
    {"name": "if_sara", "displayName": "Sara", "gender": "Female", "locale": "it-IT", "accent": "Italian", "language": "Italian", "region": "IT", "flag": "🇮🇹", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "im_nicola", "displayName": "Nicola", "gender": "Male", "locale": "it-IT", "accent": "Italian", "language": "Italian", "region": "IT", "flag": "🇮🇹", "quality": "Studio HQ", "recommended": False, "engine": "studio"},

    # ── Japanese (4 Female, 1 Male = 5 voices) ───────────────────────────
    {"name": "jf_alpha", "displayName": "Alpha (JP)", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "jf_gongitsune", "displayName": "Gongitsune", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "jf_nezumi", "displayName": "Nezumi", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "jf_tebukuro", "displayName": "Tebukuro", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "jm_kumo", "displayName": "Kumo", "gender": "Male", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Studio HQ", "recommended": False, "engine": "studio"},

    # ── Brazilian Portuguese (1 Female, 2 Male = 3 voices) ───────────────
    {"name": "pf_dora", "displayName": "Dora (BR)", "gender": "Female", "locale": "pt-BR", "accent": "Portuguese", "language": "Portuguese (BR)", "region": "BR", "flag": "🇧🇷", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "pm_alex", "displayName": "Alex (BR)", "gender": "Male", "locale": "pt-BR", "accent": "Portuguese", "language": "Portuguese (BR)", "region": "BR", "flag": "🇧🇷", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "pm_santa", "displayName": "Santa (BR)", "gender": "Male", "locale": "pt-BR", "accent": "Portuguese", "language": "Portuguese (BR)", "region": "BR", "flag": "🇧🇷", "quality": "Studio Pro", "recommended": False, "engine": "studio"},

    # ── Mandarin Chinese (4 Female, 4 Male = 8 voices) ───────────────────
    {"name": "zf_xiaobei", "displayName": "Xiaobei", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "zf_xiaoni", "displayName": "Xiaoni", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "zf_xiaoxiao", "displayName": "Xiaoxiao", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "zf_xiaoyi", "displayName": "Xiaoyi", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "zm_yunjian", "displayName": "Yunjian", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio HQ", "recommended": False, "engine": "studio"},
    {"name": "zm_yunxi", "displayName": "Yunxi", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "zm_yunxia", "displayName": "Yunxia", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
    {"name": "zm_yunyang", "displayName": "Yunyang", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Studio Pro", "recommended": False, "engine": "studio"},
]

STUDIO_VOICE_NAMES = {v["name"] for v in STUDIO_VOICES}
STUDIO_VOICE_MAP = {v["name"]: v for v in STUDIO_VOICES}

# ── Global Engine State ──────────────────────────────────────────────────
_model_lock = threading.RLock()
_shared_model: Optional[Any] = None
_pipelines: Dict[str, Any] = {}


def is_premium_voice(voice_name: str) -> bool:
    """Return True if voice_name belongs to Inovex Studio collection."""
    if not voice_name:
        return False
    if voice_name in STUDIO_VOICE_NAMES:
        return True
    if len(voice_name) > 3 and voice_name[2] == "_" and voice_name[:2] in {
        "af", "am", "bf", "bm", "ef", "em", "ff", "hf", "hm",
        "if", "im", "jf", "jm", "pf", "pm", "zf", "zm"
    }:
        return True
    return False


def get_premium_voice_info(voice_name: str) -> Optional[Dict[str, Any]]:
    """Retrieve metadata dict for a Studio voice."""
    return STUDIO_VOICE_MAP.get(voice_name)


def get_all_premium_voices() -> List[Dict[str, Any]]:
    """Return all 54 Studio voice definitions."""
    return list(STUDIO_VOICES)


def _get_shared_model():
    """Lazily load and cache the neural model."""
    global _shared_model
    if _shared_model is not None:
        return _shared_model

    with _model_lock:
        if _shared_model is not None:
            return _shared_model

        try:
            from kokoro import KModel
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading Studio HD neural model on device: {device}...")
            _shared_model = KModel().to(device).eval()
            logger.info("Studio HD model loaded successfully.")
            return _shared_model
        except Exception as exc:
            logger.error(f"Failed to load Studio HD model: {exc}")
            raise RuntimeError(f"Studio HD initialization failed: {exc}")


def _get_pipeline(lang_code: str):
    """Retrieve or create a cached pipeline for a specific language code."""
    global _pipelines
    if lang_code in _pipelines:
        return _pipelines[lang_code]

    with _model_lock:
        if lang_code in _pipelines:
            return _pipelines[lang_code]

        from kokoro import KPipeline
        model = _get_shared_model()

        # Handle Japanese fallback if misaki[ja] is unavailable
        if lang_code == "j":
            try:
                pipeline = KPipeline(lang_code="j", model=model)
            except Exception:
                from misaki import espeak
                logger.warning("Falling back to espeak for Japanese pipeline")
                pipeline = KPipeline(lang_code="a", model=model)
                pipeline.lang_code = "j"
                pipeline.g2p = espeak.EspeakG2P(language="ja")
        else:
            pipeline = KPipeline(lang_code=lang_code, model=model)

        _pipelines[lang_code] = pipeline
        logger.info(f"Initialized Studio pipeline for lang_code='{lang_code}'.")
        return pipeline


def synthesize_premium(
    text: str,
    voice: str = "af_heart",
    rate_pct: int = 0,
) -> bytes:
    """
    Synthesize speech using Inovex Studio HD and return MP3 audio bytes.
    - text: input text
    - voice: voice ID (e.g. 'af_heart')
    - rate_pct: speed offset (-50 to +50 percent)
    """
    if not text or not text.strip():
        raise ValueError("Synthesis text cannot be empty.")

    if not is_premium_voice(voice):
        raise ValueError(f"Unknown Studio voice: '{voice}'")

    lang_code = voice[0].lower()
    speed = 1.0 + (rate_pct / 100.0)
    speed = max(0.5, min(2.0, speed))

    pipeline = _get_pipeline(lang_code)

    generator = pipeline(
        text=text.strip(),
        voice=voice,
        speed=speed,
        split_pattern=r"(?<=[.!?\n])\s+",
    )

    audio_chunks: List[np.ndarray] = []
    for _, _, audio in generator:
        if audio is not None:
            if hasattr(audio, "cpu"):
                audio_np = audio.cpu().numpy()
            elif hasattr(audio, "numpy"):
                audio_np = audio.numpy()
            else:
                audio_np = np.array(audio)
            audio_chunks.append(audio_np)

    if not audio_chunks:
        raise RuntimeError("No audio was produced by Studio synthesis.")

    full_audio = np.concatenate(audio_chunks)

    # 1. Peak-normalize to 0.95 so speech is loud, clear, and studio-level
    max_amp = float(np.max(np.abs(full_audio)))
    if max_amp > 0.01:
        full_audio = full_audio / max_amp * 0.95

    # 2. Encode to high-fidelity 192kbps MP3 (PyAV) for studio acoustics
    try:
        import av
        buf = io.BytesIO()
        container = av.open(buf, mode="w", format="mp3")
        stream = container.add_stream("mp3", rate=24000)
        stream.bit_rate = 192000
        frame = av.AudioFrame.from_ndarray(full_audio.reshape(1, -1).astype(np.float32), format="fltp", layout="mono")
        frame.sample_rate = 24000
        for packet in stream.encode(frame):
            container.mux(packet)
        for packet in stream.encode():
            container.mux(packet)
        container.close()
        return buf.getvalue()
    except Exception as enc_err:
        logger.warning(f"PyAV encoding fallback to soundfile: {enc_err}")
        buf = io.BytesIO()
        sf.write(buf, full_audio, 24000, format="MP3")
        return buf.getvalue()

