"""
Kokoro-82M Neural TTS Engine for Inovex TTS.
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

logger = logging.getLogger("inovex-tts.kokoro")

# ── Voice Registry: All 54 Kokoro-82M Voices ─────────────────────────────
KOKORO_VOICES: List[Dict[str, Any]] = [
    # ── American English (11 Female, 9 Male = 20 voices) ─────────────────
    {"name": "af_heart", "displayName": "Heart (Studio HQ)", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade A", "recommended": True},
    {"name": "af_bella", "displayName": "Bella", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade A", "recommended": False},
    {"name": "af_nicole", "displayName": "Nicole", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_aoede", "displayName": "Aoede", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_kore", "displayName": "Kore", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_sarah", "displayName": "Sarah", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_nova", "displayName": "Nova", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_sky", "displayName": "Sky", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_alloy", "displayName": "Alloy", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_jessica", "displayName": "Jessica", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "af_river", "displayName": "River", "gender": "Female", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_adam", "displayName": "Adam", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade A", "recommended": True},
    {"name": "am_michael", "displayName": "Michael", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade A", "recommended": False},
    {"name": "am_echo", "displayName": "Echo", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_eric", "displayName": "Eric", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_fenrir", "displayName": "Fenrir", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_liam", "displayName": "Liam", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_onyx", "displayName": "Onyx", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_puck", "displayName": "Puck", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},
    {"name": "am_santa", "displayName": "Santa", "gender": "Male", "locale": "en-US", "accent": "American English", "language": "English (US)", "region": "US", "flag": "🇺🇸", "quality": "Grade B", "recommended": False},

    # ── British English (4 Female, 4 Male = 8 voices) ────────────────────
    {"name": "bf_emma", "displayName": "Emma", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade A", "recommended": True},
    {"name": "bf_isabella", "displayName": "Isabella", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade A", "recommended": False},
    {"name": "bf_alice", "displayName": "Alice", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade B", "recommended": False},
    {"name": "bf_lily", "displayName": "Lily", "gender": "Female", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade B", "recommended": False},
    {"name": "bm_george", "displayName": "George", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade A", "recommended": True},
    {"name": "bm_fable", "displayName": "Fable", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade B", "recommended": False},
    {"name": "bm_lewis", "displayName": "Lewis", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade B", "recommended": False},
    {"name": "bm_daniel", "displayName": "Daniel", "gender": "Male", "locale": "en-GB", "accent": "British English", "language": "English (UK)", "region": "GB", "flag": "🇬🇧", "quality": "Grade B", "recommended": False},

    # ── Spanish (1 Female, 2 Male = 3 voices) ────────────────────────────
    {"name": "ef_dora", "displayName": "Dora", "gender": "Female", "locale": "es-ES", "accent": "Spanish", "language": "Spanish", "region": "ES", "flag": "🇪🇸", "quality": "Grade A", "recommended": False},
    {"name": "em_alex", "displayName": "Alex", "gender": "Male", "locale": "es-ES", "accent": "Spanish", "language": "Spanish", "region": "ES", "flag": "🇪🇸", "quality": "Grade A", "recommended": False},
    {"name": "em_santa", "displayName": "Santa (ES)", "gender": "Male", "locale": "es-ES", "accent": "Spanish", "language": "Spanish", "region": "ES", "flag": "🇪🇸", "quality": "Grade B", "recommended": False},

    # ── French (1 Female = 1 voice) ──────────────────────────────────────
    {"name": "ff_siwis", "displayName": "Siwis", "gender": "Female", "locale": "fr-FR", "accent": "French", "language": "French", "region": "FR", "flag": "🇫🇷", "quality": "Grade A", "recommended": False},

    # ── Hindi (2 Female, 2 Male = 4 voices) ──────────────────────────────
    {"name": "hf_alpha", "displayName": "Alpha", "gender": "Female", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Grade A", "recommended": False},
    {"name": "hf_beta", "displayName": "Beta", "gender": "Female", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Grade B", "recommended": False},
    {"name": "hm_omega", "displayName": "Omega", "gender": "Male", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Grade A", "recommended": False},
    {"name": "hm_psi", "displayName": "Psi", "gender": "Male", "locale": "hi-IN", "accent": "Hindi", "language": "Hindi", "region": "IN", "flag": "🇮🇳", "quality": "Grade B", "recommended": False},

    # ── Italian (1 Female, 1 Male = 2 voices) ────────────────────────────
    {"name": "if_sara", "displayName": "Sara", "gender": "Female", "locale": "it-IT", "accent": "Italian", "language": "Italian", "region": "IT", "flag": "🇮🇹", "quality": "Grade A", "recommended": False},
    {"name": "im_nicola", "displayName": "Nicola", "gender": "Male", "locale": "it-IT", "accent": "Italian", "language": "Italian", "region": "IT", "flag": "🇮🇹", "quality": "Grade A", "recommended": False},

    # ── Japanese (4 Female, 1 Male = 5 voices) ───────────────────────────
    {"name": "jf_alpha", "displayName": "Alpha (JP)", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Grade A", "recommended": False},
    {"name": "jf_gongitsune", "displayName": "Gongitsune", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Grade B", "recommended": False},
    {"name": "jf_nezumi", "displayName": "Nezumi", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Grade B", "recommended": False},
    {"name": "jf_tebukuro", "displayName": "Tebukuro", "gender": "Female", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Grade B", "recommended": False},
    {"name": "jm_kumo", "displayName": "Kumo", "gender": "Male", "locale": "ja-JP", "accent": "Japanese", "language": "Japanese", "region": "JP", "flag": "🇯🇵", "quality": "Grade A", "recommended": False},

    # ── Brazilian Portuguese (1 Female, 2 Male = 3 voices) ───────────────
    {"name": "pf_dora", "displayName": "Dora (BR)", "gender": "Female", "locale": "pt-BR", "accent": "Portuguese", "language": "Portuguese (BR)", "region": "BR", "flag": "🇧🇷", "quality": "Grade A", "recommended": False},
    {"name": "pm_alex", "displayName": "Alex (BR)", "gender": "Male", "locale": "pt-BR", "accent": "Portuguese", "language": "Portuguese (BR)", "region": "BR", "flag": "🇧🇷", "quality": "Grade A", "recommended": False},
    {"name": "pm_santa", "displayName": "Santa (BR)", "gender": "Male", "locale": "pt-BR", "accent": "Portuguese", "language": "Portuguese (BR)", "region": "BR", "flag": "🇧🇷", "quality": "Grade B", "recommended": False},

    # ── Mandarin Chinese (4 Female, 4 Male = 8 voices) ───────────────────
    {"name": "zf_xiaobei", "displayName": "Xiaobei", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade A", "recommended": False},
    {"name": "zf_xiaoni", "displayName": "Xiaoni", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade B", "recommended": False},
    {"name": "zf_xiaoxiao", "displayName": "Xiaoxiao", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade B", "recommended": False},
    {"name": "zf_xiaoyi", "displayName": "Xiaoyi", "gender": "Female", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade B", "recommended": False},
    {"name": "zm_yunjian", "displayName": "Yunjian", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade A", "recommended": False},
    {"name": "zm_yunxi", "displayName": "Yunxi", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade B", "recommended": False},
    {"name": "zm_yunxia", "displayName": "Yunxia", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade B", "recommended": False},
    {"name": "zm_yunyang", "displayName": "Yunyang", "gender": "Male", "locale": "zh-CN", "accent": "Mandarin", "language": "Chinese (Mandarin)", "region": "CN", "flag": "🇨🇳", "quality": "Grade B", "recommended": False},
]

# Set for O(1) lookup
KOKORO_VOICE_NAMES = {v["name"] for v in KOKORO_VOICES}
KOKORO_VOICE_MAP = {v["name"]: v for v in KOKORO_VOICES}

# ── Global Engine State ──────────────────────────────────────────────────
_model_lock = threading.RLock()
_shared_model: Optional[Any] = None
_pipelines: Dict[str, Any] = {}


def is_kokoro_voice(voice_name: str) -> bool:
    """Return True if voice_name belongs to Kokoro-82M."""
    if not voice_name:
        return False
    if voice_name in KOKORO_VOICE_NAMES:
        return True
    # Pattern check: af_, am_, bf_, bm_, ef_, em_, ff_, hf_, hm_, if_, im_, jf_, jm_, pf_, pm_, zf_, zm_
    if len(voice_name) > 3 and voice_name[2] == "_" and voice_name[:2] in {
        "af", "am", "bf", "bm", "ef", "em", "ff", "hf", "hm",
        "if", "im", "jf", "jm", "pf", "pm", "zf", "zm"
    }:
        return True
    return False


def get_kokoro_voice_info(voice_name: str) -> Optional[Dict[str, Any]]:
    """Retrieve metadata dict for a Kokoro voice."""
    return KOKORO_VOICE_MAP.get(voice_name)


def get_all_kokoro_voices() -> List[Dict[str, Any]]:
    """Return all 54 Kokoro voice definitions."""
    return list(KOKORO_VOICES)


def _get_shared_model():
    """Lazily load and cache the shared Kokoro model."""
    global _shared_model
    if _shared_model is not None:
        return _shared_model

    with _model_lock:
        if _shared_model is not None:
            return _shared_model

        try:
            from kokoro import KModel
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading Kokoro-82M shared model on device: {device}...")
            _shared_model = KModel().to(device).eval()
            logger.info("Kokoro-82M model loaded successfully.")
            return _shared_model
        except Exception as exc:
            logger.error(f"Failed to load Kokoro-82M model: {exc}")
            raise RuntimeError(f"Kokoro model initialization failed: {exc}")


def _get_pipeline(lang_code: str):
    """Retrieve or create a cached KPipeline for a specific language code."""
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
                # Fallback to espeak
                from misaki import espeak
                logger.warning("Falling back to espeak for Japanese pipeline")
                pipeline = KPipeline(lang_code="a", model=model)
                pipeline.lang_code = "j"
                pipeline.g2p = espeak.EspeakG2P(language="ja")
        else:
            pipeline = KPipeline(lang_code=lang_code, model=model)

        _pipelines[lang_code] = pipeline
        logger.info(f"Initialized Kokoro pipeline for lang_code='{lang_code}'.")
        return pipeline


def synthesize_kokoro(
    text: str,
    voice: str = "af_heart",
    rate_pct: int = 0,
) -> bytes:
    """
    Synthesize speech using Kokoro-82M and return MP3 audio bytes.
    - text: input text
    - voice: voice ID (e.g. 'af_heart')
    - rate_pct: speed offset (-50 to +50 percent)
    """
    if not text or not text.strip():
        raise ValueError("Synthesis text cannot be empty.")

    if not is_kokoro_voice(voice):
        raise ValueError(f"Unknown Kokoro voice: '{voice}'")

    # Map voice prefix to language code
    # e.g. 'af_heart' -> lang_code 'a'
    lang_code = voice[0].lower()

    # Calculate speed: 1.0 is normal, rate_pct adds/subtracts percentage
    speed = 1.0 + (rate_pct / 100.0)
    speed = max(0.5, min(2.0, speed))

    pipeline = _get_pipeline(lang_code)

    # Run Kokoro pipeline
    generator = pipeline(
        text=text.strip(),
        voice=voice,
        speed=speed,
        split_pattern=r"\n+",
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
        raise RuntimeError("No audio was produced by Kokoro synthesis.")

    # Concatenate all chunks (Kokoro produces 24kHz mono audio)
    full_audio = np.concatenate(audio_chunks)

    # Encode to MP3 bytes
    buf = io.BytesIO()
    sf.write(buf, full_audio, 24000, format="MP3")
    mp3_bytes = buf.getvalue()

    return mp3_bytes
