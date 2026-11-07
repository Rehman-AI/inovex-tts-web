// Voices registry with support for Inovex Studio AI Voices and Edge-TTS Neural Voices.
// Structure: Language → Region → Speakers

export interface Voice {
  name: string;        // e.g. "af_heart" or "en-US-JennyNeural"
  displayName: string;  // e.g. "Heart (Studio HQ)" or "Jenny"
  gender: "Male" | "Female";
  locale: string;       // e.g. "en-US"
  isPremium?: boolean;
  engine?: "studio" | "edge";
  accent?: string;
  flag?: string;
  quality?: string;
  recommended?: boolean;
}

export interface Region {
  code: string;         // e.g. "US"
  label: string;        // e.g. "United States"
  voices: Voice[];
}

export interface Language {
  code: string;         // e.g. "en" or "premium"
  label: string;        // e.g. "English" or "Premium Voices"
  flag: string;         // emoji flag
  isSpecial?: boolean;
  regions: Region[];
}

// ── Complete Catalog of All 54 Inovex Studio AI Voices ─────────────────────────
export const STUDIO_PREMIUM_VOICES: Voice[] = [
  // American English (20)
  { name: "af_heart", displayName: "Heart (Studio HQ)", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade A", recommended: true, isPremium: true, engine: "studio" },
  { name: "af_bella", displayName: "Bella", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "af_nicole", displayName: "Nicole", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_aoede", displayName: "Aoede", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_kore", displayName: "Kore", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_sarah", displayName: "Sarah", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_nova", displayName: "Nova", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_sky", displayName: "Sky", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_alloy", displayName: "Alloy", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_jessica", displayName: "Jessica", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "af_river", displayName: "River", gender: "Female", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_adam", displayName: "Adam", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade A", recommended: true, isPremium: true, engine: "studio" },
  { name: "am_michael", displayName: "Michael", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "am_echo", displayName: "Echo", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_eric", displayName: "Eric", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_fenrir", displayName: "Fenrir", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_liam", displayName: "Liam", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_onyx", displayName: "Onyx", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_puck", displayName: "Puck", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "am_santa", displayName: "Santa", gender: "Male", locale: "en-US", accent: "American English", flag: "🇺🇸", quality: "Grade B", isPremium: true, engine: "studio" },

  // British English (8)
  { name: "bf_emma", displayName: "Emma", gender: "Female", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade A", recommended: true, isPremium: true, engine: "studio" },
  { name: "bf_isabella", displayName: "Isabella", gender: "Female", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "bf_alice", displayName: "Alice", gender: "Female", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "bf_lily", displayName: "Lily", gender: "Female", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "bm_george", displayName: "George", gender: "Male", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade A", recommended: true, isPremium: true, engine: "studio" },
  { name: "bm_fable", displayName: "Fable", gender: "Male", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "bm_lewis", displayName: "Lewis", gender: "Male", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "bm_daniel", displayName: "Daniel", gender: "Male", locale: "en-GB", accent: "British English", flag: "🇬🇧", quality: "Grade B", isPremium: true, engine: "studio" },

  // Spanish (3)
  { name: "ef_dora", displayName: "Dora", gender: "Female", locale: "es-ES", accent: "Spanish", flag: "🇪🇸", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "em_alex", displayName: "Alex", gender: "Male", locale: "es-ES", accent: "Spanish", flag: "🇪🇸", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "em_santa", displayName: "Santa (ES)", gender: "Male", locale: "es-ES", accent: "Spanish", flag: "🇪🇸", quality: "Grade B", isPremium: true, engine: "studio" },

  // French (1)
  { name: "ff_siwis", displayName: "Siwis", gender: "Female", locale: "fr-FR", accent: "French", flag: "🇫🇷", quality: "Grade A", isPremium: true, engine: "studio" },

  // Hindi (4)
  { name: "hf_alpha", displayName: "Alpha", gender: "Female", locale: "hi-IN", accent: "Hindi", flag: "🇮🇳", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "hf_beta", displayName: "Beta", gender: "Female", locale: "hi-IN", accent: "Hindi", flag: "🇮🇳", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "hm_omega", displayName: "Omega", gender: "Male", locale: "hi-IN", accent: "Hindi", flag: "🇮🇳", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "hm_psi", displayName: "Psi", gender: "Male", locale: "hi-IN", accent: "Hindi", flag: "🇮🇳", quality: "Grade B", isPremium: true, engine: "studio" },

  // Italian (2)
  { name: "if_sara", displayName: "Sara", gender: "Female", locale: "it-IT", accent: "Italian", flag: "🇮🇹", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "im_nicola", displayName: "Nicola", gender: "Male", locale: "it-IT", accent: "Italian", flag: "🇮🇹", quality: "Grade A", isPremium: true, engine: "studio" },

  // Japanese (5)
  { name: "jf_alpha", displayName: "Alpha (JP)", gender: "Female", locale: "ja-JP", accent: "Japanese", flag: "🇯🇵", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "jf_gongitsune", displayName: "Gongitsune", gender: "Female", locale: "ja-JP", accent: "Japanese", flag: "🇯🇵", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "jf_nezumi", displayName: "Nezumi", gender: "Female", locale: "ja-JP", accent: "Japanese", flag: "🇯🇵", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "jf_tebukuro", displayName: "Tebukuro", gender: "Female", locale: "ja-JP", accent: "Japanese", flag: "🇯🇵", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "jm_kumo", displayName: "Kumo", gender: "Male", locale: "ja-JP", accent: "Japanese", flag: "🇯🇵", quality: "Grade A", isPremium: true, engine: "studio" },

  // Brazilian Portuguese (3)
  { name: "pf_dora", displayName: "Dora (BR)", gender: "Female", locale: "pt-BR", accent: "Portuguese", flag: "🇧🇷", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "pm_alex", displayName: "Alex (BR)", gender: "Male", locale: "pt-BR", accent: "Portuguese", flag: "🇧🇷", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "pm_santa", displayName: "Santa (BR)", gender: "Male", locale: "pt-BR", accent: "Portuguese", flag: "🇧🇷", quality: "Grade B", isPremium: true, engine: "studio" },

  // Mandarin Chinese (8)
  { name: "zf_xiaobei", displayName: "Xiaobei", gender: "Female", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "zf_xiaoni", displayName: "Xiaoni", gender: "Female", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "zf_xiaoxiao", displayName: "Xiaoxiao", gender: "Female", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "zf_xiaoyi", displayName: "Xiaoyi", gender: "Female", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "zm_yunjian", displayName: "Yunjian", gender: "Male", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade A", isPremium: true, engine: "studio" },
  { name: "zm_yunxi", displayName: "Yunxi", gender: "Male", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "zm_yunxia", displayName: "Yunxia", gender: "Male", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade B", isPremium: true, engine: "studio" },
  { name: "zm_yunyang", displayName: "Yunyang", gender: "Male", locale: "zh-CN", accent: "Mandarin", flag: "🇨🇳", quality: "Grade B", isPremium: true, engine: "studio" },
];

export const STUDIO_VOICE_NAMES = new Set(STUDIO_PREMIUM_VOICES.map((v) => v.name));

export function isStudioVoice(voiceName: string): boolean {
  return STUDIO_VOICE_NAMES.has(voiceName);
}

export const isPremiumVoice = isStudioVoice;

function extractDisplayName(shortName: string): string {
  // Check if Studio voice first
  const studioMatch = STUDIO_PREMIUM_VOICES.find((v) => v.name === shortName);
  if (studioMatch) return studioMatch.displayName;

  // "en-US-JennyNeural" → "Jenny"
  const parts = shortName.split("-");
  const last = parts[parts.length - 1];
  return last.replace("Neural", "").replace("Multilingual", " ★");
}

const REGION_LABELS: Record<string, string> = {
  // English
  US: "United States", GB: "United Kingdom", AU: "Australia", CA: "Canada",
  IN: "India", IE: "Ireland", KE: "Kenya", NG: "Nigeria", NZ: "New Zealand",
  PH: "Philippines", SG: "Singapore", ZA: "South Africa", TZ: "Tanzania", HK: "Hong Kong",
  // Spanish
  AR: "Argentina", BO: "Bolivia", CL: "Chile", CO: "Colombia", CR: "Costa Rica",
  CU: "Cuba", DO: "Dominican Republic", EC: "Ecuador", SV: "El Salvador",
  GQ: "Equatorial Guinea", GT: "Guatemala", HN: "Honduras", MX: "Mexico",
  NI: "Nicaragua", PA: "Panama", PY: "Paraguay", PE: "Peru", PR: "Puerto Rico",
  ES: "Spain", UY: "Uruguay", VE: "Venezuela",
  // French
  BE: "Belgium", CH: "Switzerland", FR: "France",
  // Portuguese
  BR: "Brazil", PT: "Portugal",
  // Arabic
  DZ: "Algeria", BH: "Bahrain", EG: "Egypt", IQ: "Iraq", JO: "Jordan",
  KW: "Kuwait", LB: "Lebanon", LY: "Libya", MA: "Morocco", OM: "Oman",
  QA: "Qatar", SA: "Saudi Arabia", SY: "Syria", TN: "Tunisia", AE: "UAE", YE: "Yemen",
  // Chinese
  CN: "China", TW: "Taiwan",
  // Others
  DE: "Germany", AT: "Austria", IT: "Italy", JP: "Japan", KR: "South Korea",
  RU: "Russia", TR: "Turkey", PL: "Poland", NL: "Netherlands", SE: "Sweden",
  NO: "Norway", DK: "Denmark", FI: "Finland", CZ: "Czechia", RO: "Romania",
  HU: "Hungary", BG: "Bulgaria", HR: "Croatia", SK: "Slovakia", SI: "Slovenia",
  RS: "Serbia", UA: "Ukraine", GR: "Greece", IL: "Israel", TH: "Thailand",
  VN: "Vietnam", ID: "Indonesia", MY: "Malaysia", BD: "Bangladesh", PK: "Pakistan",
  LK: "Sri Lanka", MM: "Myanmar", KH: "Cambodia", LA: "Laos", ET: "Ethiopia",
  SO: "Somalia", AF: "Afghanistan", AZ: "Azerbaijan", GE: "Georgia", AM: "Armenia",
  KZ: "Kazakhstan", UZ: "Uzbekistan", MN: "Mongolia", NP: "Nepal", EE: "Estonia",
  LV: "Latvia", LT: "Lithuania", IS: "Iceland", MT: "Malta", CY: "Cyprus",
  MK: "North Macedonia", BA: "Bosnia", ME: "Montenegro", AL: "Albania", XK: "Kosovo",
  JM: "Jamaica", TT: "Trinidad", BB: "Barbados", BS: "Bahamas", GY: "Guyana",
  SR: "Suriname", BZ: "Belize", LC: "Saint Lucia", DM: "Dominica", KN: "Saint Kitts",
  AG: "Antigua",
};

const LANGUAGE_LABELS: Record<string, { label: string; flag: string }> = {
  af: { label: "Afrikaans", flag: "🇿🇦" },
  am: { label: "Amharic", flag: "🇪🇹" },
  ar: { label: "Arabic", flag: "🇸🇦" },
  az: { label: "Azerbaijani", flag: "🇦🇿" },
  bg: { label: "Bulgarian", flag: "🇧🇬" },
  bn: { label: "Bengali", flag: "🇧🇩" },
  bs: { label: "Bosnian", flag: "🇧🇦" },
  ca: { label: "Catalan", flag: "🇪🇸" },
  cs: { label: "Czech", flag: "🇨🇿" },
  cy: { label: "Welsh", flag: "🏴" },
  da: { label: "Danish", flag: "🇩🇰" },
  de: { label: "German", flag: "🇩🇪" },
  el: { label: "Greek", flag: "🇬🇷" },
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Spanish", flag: "🇪🇸" },
  et: { label: "Estonian", flag: "🇪🇪" },
  fa: { label: "Persian", flag: "🇮🇷" },
  fi: { label: "Finnish", flag: "🇫🇮" },
  fil: { label: "Filipino", flag: "🇵🇭" },
  fr: { label: "French", flag: "🇫🇷" },
  ga: { label: "Irish", flag: "🇮🇪" },
  gl: { label: "Galician", flag: "🇪🇸" },
  gu: { label: "Gujarati", flag: "🇮🇳" },
  he: { label: "Hebrew", flag: "🇮🇱" },
  hi: { label: "Hindi", flag: "🇮🇳" },
  hr: { label: "Croatian", flag: "🇭🇷" },
  hu: { label: "Hungarian", flag: "🇭🇺" },
  id: { label: "Indonesian", flag: "🇮🇩" },
  is: { label: "Icelandic", flag: "🇮🇸" },
  it: { label: "Italian", flag: "🇮🇹" },
  ja: { label: "Japanese", flag: "🇯🇵" },
  jv: { label: "Javanese", flag: "🇮🇩" },
  ka: { label: "Georgian", flag: "🇬🇪" },
  kk: { label: "Kazakh", flag: "🇰🇿" },
  km: { label: "Khmer", flag: "🇰🇭" },
  kn: { label: "Kannada", flag: "🇮🇳" },
  ko: { label: "Korean", flag: "🇰🇷" },
  lo: { label: "Lao", flag: "🇱🇦" },
  lt: { label: "Lithuanian", flag: "🇱🇹" },
  lv: { label: "Latvian", flag: "🇱🇻" },
  mk: { label: "Macedonian", flag: "🇲🇰" },
  ml: { label: "Malayalam", flag: "🇮🇳" },
  mn: { label: "Mongolian", flag: "🇲🇳" },
  mr: { label: "Marathi", flag: "🇮🇳" },
  ms: { label: "Malay", flag: "🇲🇾" },
  mt: { label: "Maltese", flag: "🇲🇹" },
  my: { label: "Burmese", flag: "🇲🇲" },
  nb: { label: "Norwegian", flag: "🇳🇴" },
  ne: { label: "Nepali", flag: "🇳🇵" },
  nl: { label: "Dutch", flag: "🇳🇱" },
  pl: { label: "Polish", flag: "🇵🇱" },
  ps: { label: "Pashto", flag: "🇦🇫" },
  pt: { label: "Portuguese", flag: "🇵🇹" },
  ro: { label: "Romanian", flag: "🇷🇴" },
  ru: { label: "Russian", flag: "🇷🇺" },
  si: { label: "Sinhala", flag: "🇱🇰" },
  sk: { label: "Slovak", flag: "🇸🇰" },
  sl: { label: "Slovenian", flag: "🇸🇮" },
  so: { label: "Somali", flag: "🇸🇴" },
  sq: { label: "Albanian", flag: "🇦🇱" },
  sr: { label: "Serbian", flag: "🇷🇸" },
  su: { label: "Sundanese", flag: "🇮🇩" },
  sv: { label: "Swedish", flag: "🇸🇪" },
  sw: { label: "Swahili", flag: "🇰🇪" },
  ta: { label: "Tamil", flag: "🇮🇳" },
  te: { label: "Telugu", flag: "🇮🇳" },
  th: { label: "Thai", flag: "🇹🇭" },
  tr: { label: "Turkish", flag: "🇹🇷" },
  uk: { label: "Ukrainian", flag: "🇺🇦" },
  ur: { label: "Urdu", flag: "🇵🇰" },
  uz: { label: "Uzbek", flag: "🇺🇿" },
  vi: { label: "Vietnamese", flag: "🇻🇳" },
  zh: { label: "Chinese", flag: "🇨🇳" },
  zu: { label: "Zulu", flag: "🇿🇦" },
};

export function buildPremiumLanguage(): Language {
  // Group all 54 Studio voices by region/accent for the dedicated "Premium Voices" section
  const regionMap = new Map<string, { label: string; voices: Voice[] }>();

  regionMap.set("US", { label: "American English (20)", voices: [] });
  regionMap.set("GB", { label: "British English (8)", voices: [] });
  regionMap.set("ES", { label: "Spanish (3)", voices: [] });
  regionMap.set("FR", { label: "French (1)", voices: [] });
  regionMap.set("IN", { label: "Hindi (4)", voices: [] });
  regionMap.set("IT", { label: "Italian (2)", voices: [] });
  regionMap.set("JP", { label: "Japanese (5)", voices: [] });
  regionMap.set("BR", { label: "Portuguese (3)", voices: [] });
  regionMap.set("CN", { label: "Mandarin Chinese (8)", voices: [] });

  for (const voice of STUDIO_PREMIUM_VOICES) {
    const regCode = voice.locale.split("-")[1] || "US";
    const entry = regionMap.get(regCode);
    if (entry) {
      entry.voices.push(voice);
    }
  }

  const regions: Region[] = [];
  for (const [code, val] of regionMap) {
    if (val.voices.length > 0) {
      regions.push({
        code,
        label: val.label,
        voices: val.voices,
      });
    }
  }

  return {
    code: "premium",
    label: "Premium Voices",
    flag: "👑",
    isSpecial: true,
    regions,
  };
}

export function organizeVoices(
  rawVoices: Array<{
    name: string;
    gender: string;
    locale: string;
    displayName?: string;
    accent?: string;
    flag?: string;
    isPremium?: boolean;
    engine?: string;
    quality?: string;
    recommended?: boolean;
  }>
): Language[] {
  const langMap = new Map<string, Map<string, Voice[]>>();

  // Ensure Studio voices are present (either from backend or fallback constant)
  const incomingNames = new Set(rawVoices.map((v) => v.name));
  const fullVoicesList = [...rawVoices];

  for (const sv of STUDIO_PREMIUM_VOICES) {
    if (!incomingNames.has(sv.name)) {
      fullVoicesList.push(sv);
    }
  }

  for (const v of fullVoicesList) {
    const isStudio = v.isPremium || isStudioVoice(v.name) || v.engine === "studio";
    const parts = v.locale.split("-");
    const langCode = parts[0];
    const regionCode = parts.slice(1).join("-");

    if (!langMap.has(langCode)) langMap.set(langCode, new Map());
    const regionMap = langMap.get(langCode)!;
    if (!regionMap.has(regionCode)) regionMap.set(regionCode, []);

    regionMap.get(regionCode)!.push({
      name: v.name,
      displayName: v.displayName || extractDisplayName(v.name),
      gender: v.gender as "Male" | "Female",
      locale: v.locale,
      isPremium: isStudio,
      engine: isStudio ? "studio" : "edge",
      accent: v.accent,
      flag: v.flag,
      quality: v.quality,
      recommended: v.recommended,
    });
  }

  const languages: Language[] = [];

  // 1. Add dedicated "Premium Voices" section at the top of language tabs!
  languages.push(buildPremiumLanguage());

  // 2. Add regular languages with sorted regions & voices (Premium voices prioritized first inside each region!)
  for (const [langCode, regionMap] of langMap) {
    const meta = LANGUAGE_LABELS[langCode] || { label: langCode.toUpperCase(), flag: "🌐" };
    const regions: Region[] = [];

    for (const [regionCode, voices] of regionMap) {
      // Sort: Studio Premium voices first, then alphabetical
      voices.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      regions.push({
        code: regionCode,
        label: REGION_LABELS[regionCode] || regionCode,
        voices,
      });
    }

    regions.sort((a, b) => a.label.localeCompare(b.label));

    languages.push({
      code: langCode,
      label: meta.label,
      flag: meta.flag,
      regions,
    });
  }

  // Sort: Premium always #1, then English #2, Spanish #3, then alphabetical
  languages.sort((a, b) => {
    if (a.code === "premium") return -1;
    if (b.code === "premium") return 1;
    if (a.code === "en") return -1;
    if (b.code === "en") return 1;
    if (a.code === "es") return -1;
    if (b.code === "es") return 1;
    return a.label.localeCompare(b.label);
  });

  return languages;
}
