// All Edge-TTS voices organized by language with human-readable labels
// Structure: Language → Region → Speakers

export interface Voice {
  name: string;       // e.g. "en-US-JennyNeural"
  displayName: string; // e.g. "Jenny"
  gender: "Male" | "Female";
  locale: string;      // e.g. "en-US"
}

export interface Region {
  code: string;        // e.g. "US"
  label: string;       // e.g. "United States"
  voices: Voice[];
}

export interface Language {
  code: string;        // e.g. "en"
  label: string;       // e.g. "English"
  flag: string;        // emoji flag
  regions: Region[];
}

function extractDisplayName(shortName: string): string {
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

export function organizeVoices(
  rawVoices: Array<{ name: string; gender: string; locale: string }>
): Language[] {
  const langMap = new Map<string, Map<string, Voice[]>>();

  for (const v of rawVoices) {
    const parts = v.locale.split("-");
    const langCode = parts[0];
    const regionCode = parts.slice(1).join("-");

    if (!langMap.has(langCode)) langMap.set(langCode, new Map());
    const regionMap = langMap.get(langCode)!;
    if (!regionMap.has(regionCode)) regionMap.set(regionCode, []);
    regionMap.get(regionCode)!.push({
      name: v.name,
      displayName: extractDisplayName(v.name),
      gender: v.gender as "Male" | "Female",
      locale: v.locale,
    });
  }

  const languages: Language[] = [];

  for (const [langCode, regionMap] of langMap) {
    const meta = LANGUAGE_LABELS[langCode] || { label: langCode.toUpperCase(), flag: "🌐" };
    const regions: Region[] = [];

    for (const [regionCode, voices] of regionMap) {
      regions.push({
        code: regionCode,
        label: REGION_LABELS[regionCode] || regionCode,
        voices: voices.sort((a, b) => a.displayName.localeCompare(b.displayName)),
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

  // Sort: English first, Spanish second, then alphabetical
  languages.sort((a, b) => {
    if (a.code === "en") return -1;
    if (b.code === "en") return 1;
    if (a.code === "es") return -1;
    if (b.code === "es") return 1;
    return a.label.localeCompare(b.label);
  });

  return languages;
}
