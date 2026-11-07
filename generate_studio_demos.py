import os
from pathlib import Path
from backend.premium_engine import get_all_premium_voices, synthesize_premium

SENTENCES = {
    "a": "Hello! This is a preview of my voice. I can read your audiobooks, narrations, and scripts naturally.",
    "b": "Hello! This is a preview of my voice. I can narrate your content with a clear, expressive British tone.",
    "e": "¡Hola! Esta es una muestra de mi voz. Puedo leer cualquier texto con un tono natural y expresivo.",
    "f": "Bonjour! Ceci est un echantillon de ma voix. Je peux lire n'importe quel texte avec un ton naturel et clair.",
    "h": "नमस्ते! यह मेरी आवाज़ का एक नमूना है। मैं किसी भी पाठ को प्राकृतिक और स्पष्ट स्वर में पढ़ सकता हूँ।",
    "i": "Ciao! Questo è un esempio della mia voce. Posso leggere qualsiasi testo con un tono naturale e chiaro.",
    "j": "こんにちは！これは私の声のサンプルです。自然で明瞭な声をお届けします。",
    "p": "Olá! Esta é uma amostra da minha voz. Eu posso narrar seus textos com clareza e naturalidade.",
    "z": "你好！这是我的声音样本。我可以用自然清晰而富有表现力的语调朗读任何文本。",
}

out_dirs = [
    Path(r"c:\Users\power\Desktop\Final TTS\ai-tts-desktop\inovex-web\frontend\public\demos"),
    Path(r"c:\Users\power\Desktop\Final TTS\inovex-tts-web\public\demos"),
]

for d in out_dirs:
    d.mkdir(parents=True, exist_ok=True)

voices = get_all_premium_voices()
print(f"Total Studio voices to generate: {len(voices)}")

success_count = 0
for idx, v in enumerate(voices, 1):
    voice_name = v["name"]
    lang_code = voice_name[0].lower()
    text = SENTENCES.get(lang_code, SENTENCES["a"])
    
    print(f"[{idx}/{len(voices)}] Generating demo for {voice_name} ({v['displayName']})...")
    try:
        mp3_bytes = synthesize_premium(text, voice=voice_name)
        for d in out_dirs:
            file_path = d / f"{voice_name}.mp3"
            with open(file_path, "wb") as f:
                f.write(mp3_bytes)
        success_count += 1
    except Exception as exc:
        print(f"  ERROR for {voice_name}: {exc}")

print(f"\nAll done! Successfully generated {success_count}/{len(voices)} studio demo clips.")

