"""
Inovex TTS — FastAPI Backend
Serves the Edge-TTS synthesis API for the web frontend.
"""

from __future__ import annotations

import uuid
from functools import lru_cache

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


# ── Demo sentence per language (short, natural phrases) ──────────────
DEMO_SENTENCES: dict[str, str] = {
    "af": "Hallo, dit is 'n voorbeeld van my stem.",
    "am": "ሰላም፣ ይህ የድምጼ ናሙና ነው።",
    "ar": "مرحبًا، هذا نموذج لصوتي.",
    "az": "Salam, bu mənim səsimin nümunəsidir.",
    "bg": "Здравейте, това е пример за моя глас.",
    "bn": "হ্যালো, এটি আমার কণ্ঠের একটি নমুনা।",
    "bs": "Zdravo, ovo je primjer mog glasa.",
    "ca": "Hola, aquesta és una mostra de la meva veu.",
    "cs": "Dobrý den, toto je ukázka mého hlasu.",
    "cy": "Helo, dyma sampl o fy llais.",
    "da": "Hej, dette er en prøve af min stemme.",
    "de": "Hallo, dies ist eine Probe meiner Stimme.",
    "el": "Γεια σας, αυτό είναι ένα δείγμα της φωνής μου.",
    "en": "Hello, this is a sample of my voice. I hope you enjoy listening to it.",
    "es": "Hola, esta es una muestra de mi voz.",
    "et": "Tere, see on näide minu häälest.",
    "fa": "سلام، این نمونه‌ای از صدای من است.",
    "fi": "Hei, tämä on näyte äänestäni.",
    "fil": "Kamusta, ito ay isang sample ng aking boses.",
    "fr": "Bonjour, ceci est un exemple de ma voix.",
    "ga": "Dia duit, seo sampla de mo ghuth.",
    "gl": "Ola, esta é unha mostra da miña voz.",
    "gu": "નમસ્તે, આ મારા અવાજનો નમૂનો છે.",
    "he": "שלום, זו דוגמה של הקול שלי.",
    "hi": "नमस्ते, यह मेरी आवाज़ का एक नमूना है।",
    "hr": "Bok, ovo je primjer mog glasa.",
    "hu": "Helló, ez egy minta a hangomról.",
    "id": "Halo, ini adalah contoh suara saya.",
    "is": "Halló, þetta er sýnishorn af röddinni minni.",
    "it": "Ciao, questo è un esempio della mia voce.",
    "ja": "こんにちは、これは私の声のサンプルです。",
    "jv": "Halo, iki conto swara kula.",
    "ka": "გამარჯობა, ეს ჩემი ხმის ნიმუშია.",
    "kk": "Сәлеметсіз бе, бұл менің дауысымның үлгісі.",
    "km": "សួស្តី នេះជាគំរូសម្លេងរបស់ខ្ញុំ។",
    "kn": "ನಮಸ್ಕಾರ, ಇದು ನನ್ನ ಧ್ವನಿಯ ಮಾದರಿ.",
    "ko": "안녕하세요, 이것은 제 목소리 샘플입니다.",
    "lo": "ສະບາຍດີ, ນີ້ແມ່ນຕົວຢ່າງຂອງສຽງຂ້ອຍ.",
    "lt": "Sveiki, tai mano balso pavyzdys.",
    "lv": "Sveiki, šis ir manas balss paraugs.",
    "mk": "Здраво, ова е пример за мојот глас.",
    "ml": "ഹലോ, ഇത് എന്റെ ശബ്ദത്തിന്റെ ഒരു സാമ്പിളാണ്.",
    "mn": "Сайн байна уу, энэ бол миний дууны жишээ.",
    "mr": "नमस्कार, हा माझ्या आवाजाचा नमुना आहे.",
    "ms": "Hello, ini adalah sampel suara saya.",
    "mt": "Bongu, dan huwa eżempju tal-vuċi tiegħi.",
    "my": "မင်္ဂလာပါ၊ ဒါက ကျွန်တော့်အသံနမူနာပါ။",
    "nb": "Hei, dette er et eksempel på stemmen min.",
    "ne": "नमस्ते, यो मेरो आवाजको नमूना हो।",
    "nl": "Hallo, dit is een voorbeeld van mijn stem.",
    "pl": "Cześć, to jest próbka mojego głosu.",
    "ps": "سلام، دا زما د غږ یوه بیلګه ده.",
    "pt": "Olá, esta é uma amostra da minha voz.",
    "ro": "Bună, aceasta este o mostră a vocii mele.",
    "ru": "Привет, это пример моего голоса.",
    "si": "හෙලෝ, මෙය මගේ හඬේ නියැදියකි.",
    "sk": "Ahoj, toto je ukážka môjho hlasu.",
    "sl": "Pozdravljeni, to je vzorec mojega glasu.",
    "so": "Salaamu, kani waa muunad codkeyga.",
    "sq": "Përshëndetje, kjo është një mostër e zërit tim.",
    "sr": "Здраво, ово је пример мог гласа.",
    "su": "Halo, ieu conto sora kuring.",
    "sv": "Hej, detta är ett prov på min röst.",
    "sw": "Habari, hii ni sampuli ya sauti yangu.",
    "ta": "வணக்கம், இது என் குரலின் மாதிரி.",
    "te": "హలో, ఇది నా గొంతు నమూనా.",
    "th": "สวัสดีครับ นี่คือตัวอย่างเสียงของผม",
    "tr": "Merhaba, bu sesimin bir örneğidir.",
    "uk": "Привіт, це зразок мого голосу.",
    "ur": "ہیلو، یہ میری آواز کا ایک نمونہ ہے۔",
    "uz": "Salom, bu mening ovozimning namunasi.",
    "vi": "Xin chào, đây là mẫu giọng nói của tôi.",
    "zh": "你好，这是我的声音样本。",
    "zu": "Sawubona, lesi yisampuli yezwi lami.",
}


# ── In-memory cache for demo audio ──────────────────────────────────
_demo_cache: dict[str, bytes] = {}


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


@app.get("/api/demo")
async def demo_voice(voice: str):
    """Generate a short demo clip for a given voice and return MP3 bytes.
    Results are cached in memory so repeated requests are instant."""

    # Return cached audio if available
    if voice in _demo_cache:
        return Response(
            content=_demo_cache[voice],
            media_type="audio/mpeg",
            headers={"X-Cache": "HIT"},
        )

    # Determine demo text from the voice's language code
    # Voice names look like "en-US-JennyNeural", "fr-FR-DeniseNeural", etc.
    parts = voice.split("-")
    lang_code = parts[0] if parts else "en"
    demo_text = DEMO_SENTENCES.get(lang_code, DEMO_SENTENCES["en"])

    try:
        communicate = edge_tts.Communicate(
            text=demo_text,
            voice=voice,
            rate="+0%",
            pitch="+0Hz",
        )

        audio_chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        if not audio_chunks:
            raise HTTPException(status_code=500, detail="No audio data generated")

        audio_bytes = b"".join(audio_chunks)

        # Cache for future requests
        _demo_cache[voice] = audio_bytes

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"X-Cache": "MISS"},
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Demo generation failed: {str(exc)}")


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
