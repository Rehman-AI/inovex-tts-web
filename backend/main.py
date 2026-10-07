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


# ── Demo sentences per language (~25-30 words for ~10 second clips) ───
DEMO_SENTENCES: dict[str, str] = {
    "af": "Hallo, dit is 'n voorbeeld van my stem. Ek kan vir jou enige teks voorlees met 'n natuurlike en duidelike klank. Ek hoop jy geniet dit om na my te luister.",
    "am": "ሰላም፣ ይህ የድምጼ ናሙና ነው። ማንኛውንም ጽሑፍ በተፈጥሯዊ እና ግልጽ ድምጽ ማንበብ እችላለሁ። ይህን ናሙና ሲያዳምጡ ይደሰታሉ ብዬ ተስፋ አደርጋለሁ።",
    "ar": "مرحبًا، هذا نموذج لصوتي. يمكنني قراءة أي نص بصوت طبيعي وواضح. آمل أن تستمتعوا بالاستماع إلى هذا العرض التوضيحي لصوتي.",
    "az": "Salam, bu mənim səsimin nümunəsidir. Mən istənilən mətni təbii və aydın səslə oxuya bilərəm. Ümid edirəm ki, bu demo dinləməkdən həzz alacaqsınız.",
    "bg": "Здравейте, това е пример за моя глас. Мога да чета всякакъв текст с естествен и ясен звук. Надявам се да ви хареса да слушате тази демонстрация.",
    "bn": "হ্যালো, এটি আমার কণ্ঠের একটি নমুনা। আমি যেকোনো লেখা স্বাভাবিক এবং স্পষ্ট স্বরে পড়তে পারি। আশা করি এই ডেমো শুনতে আপনার ভালো লাগবে।",
    "bs": "Zdravo, ovo je primjer mog glasa. Mogu čitati bilo koji tekst prirodnim i jasnim tonom. Nadam se da ćete uživati slušajući ovu demonstraciju mog glasa.",
    "ca": "Hola, aquesta és una mostra de la meva veu. Puc llegir qualsevol text amb un so natural i clar. Espero que gaudiu escoltant aquesta demostració de la meva veu.",
    "cs": "Dobrý den, toto je ukázka mého hlasu. Mohu číst jakýkoli text přirozeným a jasným hlasem. Doufám, že si tuto ukázku mého hlasu rádi poslechnete.",
    "cy": "Helo, dyma sampl o fy llais. Gallaf ddarllen unrhyw destun gyda sain naturiol a chlir. Gobeithio y byddwch yn mwynhau gwrando ar y sampl hwn o fy llais.",
    "da": "Hej, dette er en prøve af min stemme. Jeg kan læse enhver tekst op med en naturlig og klar lyd. Jeg håber, du nyder at lytte til denne demonstration af min stemme.",
    "de": "Hallo, dies ist eine Probe meiner Stimme. Ich kann jeden beliebigen Text mit einer natürlichen und klaren Stimme vorlesen. Ich hoffe, Ihnen gefällt diese Demonstration.",
    "el": "Γεια σας, αυτό είναι ένα δείγμα της φωνής μου. Μπορώ να διαβάσω οποιοδήποτε κείμενο με φυσικό και καθαρό ήχο. Ελπίζω να σας αρέσει αυτή η επίδειξη.",
    "en": "Hello, this is a sample of my voice. I can read any text with a natural and clear tone. I hope you enjoy listening to this demonstration and find the quality to your liking.",
    "es": "Hola, esta es una muestra de mi voz. Puedo leer cualquier texto con un tono natural y claro. Espero que disfruten escuchando esta demostración de mi voz.",
    "et": "Tere, see on näide minu häälest. Ma saan lugeda mis tahes teksti loomuliku ja selge häälega. Loodan, et teile meeldib seda demonstratsiooni kuulata.",
    "fa": "سلام، این نمونه‌ای از صدای من است. من می‌توانم هر متنی را با لحنی طبیعی و واضح بخوانم. امیدوارم از شنیدن این نمونه صدای من لذت ببرید.",
    "fi": "Hei, tämä on näyte äänestäni. Voin lukea minkä tahansa tekstin luonnollisella ja selkeällä äänellä. Toivon, että nautit tämän äänidemonstraation kuuntelusta.",
    "fil": "Kamusta, ito ay isang sample ng aking boses. Kayang kong basahin ang anumang teksto na may natural at malinaw na tono. Sana ay magustuhan ninyo ang demo na ito.",
    "fr": "Bonjour, ceci est un exemple de ma voix. Je peux lire n'importe quel texte avec un ton naturel et clair. J'espère que vous apprécierez cette démonstration de ma voix.",
    "ga": "Dia duit, seo sampla de mo ghuth. Is féidir liom aon téacs a léamh le ton nádúrtha agus soiléir. Tá súil agam go mbainfidh tú taitneamh as éisteacht leis seo.",
    "gl": "Ola, esta é unha mostra da miña voz. Podo ler calquera texto cun ton natural e claro. Espero que gocen escoitando esta demostración da miña voz.",
    "gu": "નમસ્તે, આ મારા અવાજનો નમૂનો છે. હું કોઈપણ લખાણને કુદરતી અને સ્પષ્ટ સ્વરમાં વાંચી શકું છું. આશા છે કે તમને આ ડેમો સાંભળવામાં આનંદ આવશે.",
    "he": "שלום, זו דוגמה של הקול שלי. אני יכול לקרוא כל טקסט בטון טבעי וברור. אני מקווה שתהנו להאזין להדגמה הזו של הקול שלי.",
    "hi": "नमस्ते, यह मेरी आवाज़ का एक नमूना है। मैं किसी भी पाठ को प्राकृतिक और स्पष्ट स्वर में पढ़ सकता हूँ। मुझे उम्मीद है कि आपको यह डेमो सुनकर अच्छा लगेगा।",
    "hr": "Bok, ovo je primjer mog glasa. Mogu čitati bilo koji tekst prirodnim i jasnim tonom. Nadam se da ćete uživati slušajući ovu demonstraciju mog glasa.",
    "hu": "Helló, ez egy minta a hangomról. Bármilyen szöveget fel tudok olvasni természetes és tiszta hangon. Remélem, élvezni fogják ennek a hangbemutató meghallgatását.",
    "id": "Halo, ini adalah contoh suara saya. Saya dapat membaca teks apa pun dengan nada yang alami dan jelas. Semoga Anda menikmati mendengarkan demonstrasi suara ini.",
    "is": "Halló, þetta er sýnishorn af röddinni minni. Ég get lesið hvaða texta sem er með náttúrulegum og skýrum hljómi. Ég vona að þér líki vel við þessa sýnikennslu.",
    "it": "Ciao, questo è un esempio della mia voce. Posso leggere qualsiasi testo con un tono naturale e chiaro. Spero che questa dimostrazione della mia voce vi piaccia.",
    "ja": "こんにちは、これは私の声のサンプルです。私はどんなテキストでも自然で明瞭な声で読み上げることができます。このデモンストレーションをお楽しみいただければ幸いです。",
    "jv": "Halo, iki conto swara kula. Kula saged maos teks menapa kemawon kanthi nada alami lan cetha. Mugi panjenengan remen mirengaken demonstrasi swara menika.",
    "ka": "გამარჯობა, ეს ჩემი ხმის ნიმუშია. მე შემიძლია ნებისმიერი ტექსტის წაკითხვა ბუნებრივი და გარკვევით ტონით. ვიმედოვნებ, რომ მოგეწონებათ ეს დემონსტრაცია.",
    "kk": "Сәлеметсіз бе, бұл менің дауысымның үлгісі. Мен кез келген мәтінді табиғи және анық дауыспен оқи аламын. Бұл демонстрацияны тыңдау сізге ұнайды деп сенемін.",
    "km": "សួស្តី នេះជាគំរូសម្លេងរបស់ខ្ញុំ។ ខ្ញុំអាចអានអត្ថបទណាមួយដោយសម្លេងធម្មជាតិ និងច្បាស់លាស់។ ខ្ញុំសង្ឃឹមថាអ្នកនឹងរីករាយស្តាប់ការបង្ហាញនេះ។",
    "kn": "ನಮಸ್ಕಾರ, ಇದು ನನ್ನ ಧ್ವನಿಯ ಮಾದರಿ. ನಾನು ಯಾವುದೇ ಪಠ್ಯವನ್ನು ನೈಸರ್ಗಿಕ ಮತ್ತು ಸ್ಪಷ್ಟ ಧ್ವನಿಯಲ್ಲಿ ಓದಬಲ್ಲೆ. ಈ ಪ್ರದರ್ಶನವನ್ನು ಕೇಳಲು ನಿಮಗೆ ಇಷ್ಟವಾಗುತ್ತದೆ ಎಂದು ಭಾವಿಸುತ್ತೇನೆ.",
    "ko": "안녕하세요, 이것은 제 목소리 샘플입니다. 저는 어떤 텍스트든 자연스럽고 명확한 톤으로 읽을 수 있습니다. 이 음성 데모를 즐겁게 들어주시기 바랍니다.",
    "lo": "ສະບາຍດີ, ນີ້ແມ່ນຕົວຢ່າງຂອງສຽງຂ້ອຍ. ຂ້ອຍສາມາດອ່ານຂໍ້ຄວາມໃດກໍໄດ້ດ້ວຍສຽງທຳມະຊາດ ແລະ ຊັດເຈນ. ຫວັງວ່າທ່ານຈະມັກຟັງການສາທິດນີ້.",
    "lt": "Sveiki, tai mano balso pavyzdys. Galiu perskaityti bet kokį tekstą natūraliu ir aiškiu balsu. Tikiuosi, kad jums patiks klausytis šios demonstracijos.",
    "lv": "Sveiki, šis ir manas balss paraugs. Es varu nolasīt jebkuru tekstu dabiskā un skaidrā balsī. Ceru, ka jums patiks klausīties šo demonstrāciju.",
    "mk": "Здраво, ова е пример за мојот глас. Можам да прочитам било кој текст со природен и јасен тон. Се надевам дека ќе уживате слушајќи ја оваа демонстрација.",
    "ml": "ഹലോ, ഇത് എന്റെ ശബ്ദത്തിന്റെ ഒരു സാമ്പിളാണ്. എനിക്ക് ഏത് ടെക്സ്റ്റും സ്വാഭാവികവും വ്യക്തവുമായ ശബ്ദത്തിൽ വായിക്കാൻ കഴിയും. ഈ ഡെമോ ആസ്വദിക്കുമെന്ന് പ്രതീക്ഷിക്കുന്നു.",
    "mn": "Сайн байна уу, энэ бол миний дууны жишээ. Би ямар ч текстийг байгалийн ба тод дуугаар уншиж чадна. Энэ жишээг сонсох таалал авна гэж найдаж байна.",
    "mr": "नमस्कार, हा माझ्या आवाजाचा नमुना आहे. मी कोणताही मजकूर नैसर्गिक आणि स्पष्ट स्वरात वाचू शकतो. हा डेमो ऐकून तुम्हाला आनंद होईल अशी आशा आहे.",
    "ms": "Halo, ini adalah sampel suara saya. Saya boleh membaca apa-apa teks dengan nada yang semula jadi dan jelas. Saya harap anda menikmati mendengar demonstrasi suara ini.",
    "mt": "Bongu, dan huwa eżempju tal-vuċi tiegħi. Nista' naqra kwalunkwe test b'ton naturali u ċar. Nittama li tgawdu tisimgħu din id-dimostrazzjoni tal-vuċi tiegħi.",
    "my": "မင်္ဂလာပါ၊ ဒါက ကျွန်တော့်အသံနမူနာပါ။ ကျွန်တော် မည်သည့်စာသားကိုမဆို သဘာဝကျပြီး ရှင်းလင်းစွာ ဖတ်ပြနိုင်ပါတယ်။ ဒီသရုပ်ပြမှုကို နှစ်သက်မယ်လို့ မျှော်လင့်ပါတယ်။",
    "nb": "Hei, dette er et eksempel på stemmen min. Jeg kan lese enhver tekst med en naturlig og klar stemme. Jeg håper du liker å høre på denne demonstrasjonen av stemmen min.",
    "ne": "नमस्ते, यो मेरो आवाजको नमूना हो। म कुनै पनि पाठ प्राकृतिक र स्पष्ट स्वरमा पढ्न सक्छु। तपाईंलाई यो डेमो सुन्न रमाइलो लाग्छ भन्ने आशा गर्दछु।",
    "nl": "Hallo, dit is een voorbeeld van mijn stem. Ik kan elke tekst voorlezen met een natuurlijke en heldere toon. Ik hoop dat u geniet van het luisteren naar deze demonstratie.",
    "pl": "Cześć, to jest próbka mojego głosu. Mogę przeczytać dowolny tekst naturalnym i wyraźnym tonem. Mam nadzieję, że spodoba się wam ta demonstracja mojego głosu.",
    "ps": "سلام، دا زما د غږ یوه بیلګه ده. زه کولی شم هر متن په طبیعي او روښانه غږ ولولم. هیله ده چې تاسو د دې نمونې اوریدو څخه خوند واخلئ.",
    "pt": "Olá, esta é uma amostra da minha voz. Eu posso ler qualquer texto com um tom natural e claro. Espero que gostem de ouvir esta demonstração da minha voz.",
    "ro": "Bună, aceasta este o mostră a vocii mele. Pot citi orice text cu un ton natural și clar. Sper că vă place să ascultați această demonstrație a vocii mele.",
    "ru": "Привет, это пример моего голоса. Я могу прочитать любой текст естественным и чётким голосом. Надеюсь, вам понравится эта демонстрация моего голоса.",
    "si": "හෙලෝ, මෙය මගේ හඬේ නියැදියකි. මට ඕනෑම පෙළක් ස්වාභාවික සහ පැහැදිලි හඬින් කියවිය හැකිය. මෙම නිරූපණය ඔබට ප්‍රිය වේ යැයි මම බලාපොරොත්තු වෙමි.",
    "sk": "Ahoj, toto je ukážka môjho hlasu. Dokážem prečítať akýkoľvek text prirodzeným a jasným hlasom. Dúfam, že si túto ukážku môjho hlasu radi vypočujete.",
    "sl": "Pozdravljeni, to je vzorec mojega glasu. Lahko preberem kakršno koli besedilo z naravnim in jasnim tonom. Upam, da boste uživali v poslušanju te predstavitve.",
    "so": "Salaamu, kani waa muunad codkeyga. Waxaan akhrisan karaa qoraal kasta oo leh dhawaaqi dabiici ah oo cad. Waxaan rajeyneynaa inaad ka raaxeysato dhageysiga muunadkan.",
    "sq": "Përshëndetje, kjo është një mostër e zërit tim. Mund të lexoj çdo tekst me një ton natyral dhe të qartë. Shpresoj që do ta shijoni dëgjimin e kësaj demonstrimi.",
    "sr": "Здраво, ово је пример мог гласа. Могу да читам било који текст природним и јасним тоном. Надам се да ћете уживати слушајући ову демонстрацију мог гласа.",
    "su": "Halo, ieu conto sora kuring. Abdi tiasa maca téks naon waé kalayan nada alami sareng jelas. Mugi-mugi anjeun resep ngadangukeun demonstrasi sora ieu.",
    "sv": "Hej, detta är ett prov på min röst. Jag kan läsa vilken text som helst med en naturlig och tydlig ton. Jag hoppas att du gillar att lyssna på denna demonstration.",
    "sw": "Habari, hii ni sampuli ya sauti yangu. Ninaweza kusoma maandishi yoyote kwa sauti ya asili na wazi. Natumaini utafurahia kusikiliza maonyesho haya ya sauti yangu.",
    "ta": "வணக்கம், இது என் குரலின் மாதிரி. நான் எந்த உரையையும் இயற்கையான மற்றும் தெளிவான குரலில் படிக்க முடியும். இந்த ஒலி விளக்கத்தை நீங்கள் ரசிப்பீர்கள் என நம்புகிறேன்.",
    "te": "హలో, ఇది నా గొంతు నమూనా. నేను ఏ టెక్స్ట్ అయినా సహజంగా మరియు స్పష్టంగా చదవగలను. ఈ ధ్వని ప్రదర్శనను మీరు ఆనందిస్తారని ఆశిస్తున్నాను.",
    "th": "สวัสดีครับ นี่คือตัวอย่างเสียงของผม ผมสามารถอ่านข้อความใดก็ได้ด้วยน้ำเสียงที่เป็นธรรมชาติและชัดเจน หวังว่าคุณจะชอบการสาธิตเสียงนี้ครับ",
    "tr": "Merhaba, bu sesimin bir örneğidir. Herhangi bir metni doğal ve net bir tonla okuyabilirim. Umarım sesimin bu tanıtımını dinlemekten keyif alırsınız.",
    "uk": "Привіт, це зразок мого голосу. Я можу прочитати будь-який текст природним і чітким голосом. Сподіваюся, вам сподобається ця демонстрація мого голосу.",
    "ur": "ہیلو، یہ میری آواز کا ایک نمونہ ہے۔ میں کسی بھی متن کو قدرتی اور واضح لہجے میں پڑھ سکتا ہوں۔ مجھے امید ہے کہ آپ کو میری آواز کا یہ مظاہرہ پسند آئے گا۔",
    "uz": "Salom, bu mening ovozimning namunasi. Men istalgan matnni tabiiy va aniq ohangda o'qiy olaman. Ushbu namoyishni tinglashdan zavqlanasiz deb umid qilaman.",
    "vi": "Xin chào, đây là mẫu giọng nói của tôi. Tôi có thể đọc bất kỳ văn bản nào với giọng tự nhiên và rõ ràng. Hy vọng bạn thích nghe bản trình diễn giọng nói này.",
    "zh": "你好，这是我的声音样本。我可以用自然清晰的语调朗读任何文本。希望您喜欢这段语音演示，并觉得声音质量令人满意。",
    "zu": "Sawubona, lesi yisampuli yezwi lami. Ngingafunda noma yimuphi umbhalo ngezwi elivamile nelisobala. Ngithemba ukuthi uyakuthokozela ukulalela le demo yezwi lami.",
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
