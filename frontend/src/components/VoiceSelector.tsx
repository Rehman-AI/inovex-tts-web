"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Language, Voice, organizeVoices, KOKORO_PREMIUM_VOICES } from "@/data/voices";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

export default function VoiceSelector({ selectedVoice, onVoiceChange }: VoiceSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("premium"); // Default to Premium Voices!
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Demo playback state
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch(`${API_URL}/api/voices`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const organized = organizeVoices(data);
        setLanguages(organized);
      } catch {
        // Fallback: organize using built-in Kokoro and offline catalog
        const organized = organizeVoices(KOKORO_PREMIUM_VOICES);
        setLanguages(organized);
      } finally {
        setLoading(false);
      }
    }
    fetchVoices();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (demoAudioRef.current) {
        demoAudioRef.current.pause();
        demoAudioRef.current = null;
      }
    };
  }, []);

  const playDemo = useCallback((voiceName: string, isPremium: boolean = false, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (playingVoice === voiceName) {
      if (demoAudioRef.current) {
        demoAudioRef.current.pause();
        demoAudioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }

    // Stop any currently playing demo
    if (demoAudioRef.current) {
      demoAudioRef.current.pause();
      demoAudioRef.current.currentTime = 0;
    }

    // Determine initial URL: Kokoro voices are served from API, static Edge-TTS from /demos/
    const initialUrl = (isPremium || voiceName.includes("_"))
      ? `${API_URL}/api/demo?voice=${voiceName}`
      : `/demos/${voiceName}.mp3`;

    const audio = new Audio(initialUrl);
    demoAudioRef.current = audio;
    setPlayingVoice(voiceName);

    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => {
      // If local static /demos/ file failed, fallback to backend dynamic demo endpoint
      if (!initialUrl.startsWith(API_URL)) {
        const fallbackAudio = new Audio(`${API_URL}/api/demo?voice=${voiceName}`);
        demoAudioRef.current = fallbackAudio;
        fallbackAudio.onended = () => setPlayingVoice(null);
        fallbackAudio.onerror = () => {
          setPlayingVoice(null);
          console.warn(`Demo not available for ${voiceName}`);
        };
        fallbackAudio.play().catch(() => setPlayingVoice(null));
      } else {
        setPlayingVoice(null);
      }
    };
    audio.play().catch(() => setPlayingVoice(null));
  }, [playingVoice]);

  const currentLanguage = useMemo(
    () => languages.find((l) => l.code === selectedLang) || languages[0],
    [languages, selectedLang]
  );

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return languages;
    const q = searchQuery.toLowerCase();
    return languages.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.regions.some((r) =>
          r.voices.some((v) =>
            v.displayName.toLowerCase().includes(q) ||
            v.name.toLowerCase().includes(q) ||
            (v.accent && v.accent.toLowerCase().includes(q))
          )
        )
    );
  }, [languages, searchQuery]);

  const selectedVoiceData = useMemo(() => {
    for (const lang of languages) {
      for (const region of lang.regions) {
        const voice = region.voices.find((v) => v.name === selectedVoice);
        if (voice) return { voice, region, lang };
      }
    }
    // Check Kokoro list directly as fallback
    const kokoro = KOKORO_PREMIUM_VOICES.find((v) => v.name === selectedVoice);
    if (kokoro) {
      return {
        voice: kokoro,
        region: { code: "US", label: kokoro.accent || "American English", voices: [] },
        lang: { code: "premium", label: "Premium Voices", flag: "👑", regions: [] },
      };
    }
    return null;
  }, [languages, selectedVoice]);

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const renderVoiceCard = (voice: Voice) => {
    const isSelected = selectedVoice === voice.name;
    const isPlaying = playingVoice === voice.name;
    const isPrem = voice.isPremium || voice.engine === "kokoro";

    return (
      <div
        key={voice.name}
        className={`px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200
                    flex items-center gap-2 group/voice relative border
                    ${isSelected
                      ? isPrem
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 border-amber-500 font-semibold"
                        : "bg-accent text-white shadow-md shadow-accent/20 border-accent"
                      : isPrem
                        ? "bg-amber-500/5 hover:bg-amber-500/10 text-charcoal border-amber-500/20 hover:border-amber-500/40"
                        : "bg-surface hover:bg-gray-50 text-gray-700 border-border hover:border-accent/40"
                    }`}
      >
        {/* Voice select area */}
        <button
          onClick={() => {
            onVoiceChange(voice.name);
            setIsOpen(false);
          }}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left"
        >
          <span className="text-base shrink-0">
            {isPrem ? "👑" : voice.gender === "Female" ? "👩" : "👨"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold leading-tight truncate">{voice.displayName}</p>
              {isPrem && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded leading-none shrink-0 ${
                    isSelected ? "bg-white/25 text-white" : "bg-amber-500/15 text-amber-700"
                  }`}
                >
                  HQ
                </span>
              )}
            </div>
            <p
              className={`text-xs leading-tight mt-0.5 truncate ${
                isSelected ? "text-white/80" : "text-gray-400"
              }`}
            >
              {voice.accent ? `${voice.accent} • ` : ""}
              {voice.gender}
            </p>
          </div>
        </button>

        {/* Demo play button */}
        <button
          onClick={(e) => playDemo(voice.name, isPrem, e)}
          title={isPlaying ? "Stop preview" : "Listen to sample preview"}
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                      transition-all duration-200 cursor-pointer
                      ${isPlaying
                        ? isSelected
                          ? "bg-white/30 text-white hover:bg-white/40"
                          : "bg-accent text-white shadow-sm"
                        : isSelected
                          ? "bg-white/20 text-white hover:bg-white/30 opacity-0 group-hover/voice:opacity-100"
                          : isPrem
                            ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 opacity-0 group-hover/voice:opacity-100"
                            : "bg-gray-100 text-gray-500 hover:bg-accent/10 hover:text-accent opacity-0 group-hover/voice:opacity-100"
                      }
                      ${isPlaying ? "!opacity-100" : ""}`}
        >
          {isPlaying ? (
            /* Stop icon */
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  };

  const isCurrentPremium = selectedVoiceData?.voice.isPremium || selectedVoiceData?.voice.engine === "kokoro";

  return (
    <div className="relative">
      {/* Selected voice button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface border rounded-xl p-4 flex items-center justify-between cursor-pointer 
                   transition-all duration-300 group shadow-xs ${
                     isCurrentPremium
                       ? "border-amber-500/40 hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/10 bg-gradient-to-r from-amber-500/[0.03] to-transparent"
                       : "border-border hover:border-accent hover:shadow-md"
                   }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl">{selectedVoiceData?.lang.flag || "🌐"}</span>
            {isCurrentPremium && (
              <span className="absolute -top-1 -right-1 text-xs">👑</span>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-bold text-charcoal">
                {selectedVoiceData?.voice.displayName || "Select Voice"}
              </p>
              {isCurrentPremium ? (
                <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                  PREMIUM HQ
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  Neural
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedVoiceData?.voice.accent || selectedVoiceData?.region.label || selectedVoiceData?.lang.label} •{" "}
              {selectedVoiceData?.voice.gender === "Female" ? "👩 Female" : "👨 Male"}{" "}
              {isCurrentPremium ? "• Studio Quality (Kokoro-82M)" : "• Standard (Edge-TTS)"}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full shadow-2xl rounded-2xl overflow-hidden
                        border border-border max-h-[540px] flex flex-col animate-fadeIn bg-surface">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100 bg-bg-alt/50">
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by voice name, language, or accent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-charcoal
                           placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                           transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Language list (sidebar) */}
            <div className="w-52 border-r border-gray-100 overflow-y-auto scrollbar-thin bg-bg-alt/30">
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.code;
                const isSpecialPrem = lang.code === "premium";

                return (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between gap-2
                                transition-all duration-150 cursor-pointer
                                ${isSelected
                                  ? isSpecialPrem
                                    ? "bg-amber-500/15 text-amber-800 font-bold border-r-3 border-amber-500"
                                    : "bg-accent/10 text-accent font-semibold border-r-3 border-accent"
                                  : isSpecialPrem
                                    ? "hover:bg-amber-500/10 text-amber-700 font-semibold"
                                    : "hover:bg-accent/5 text-gray-600"
                                }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <span className="truncate">{lang.label}</span>
                    </div>
                    {isSpecialPrem && (
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full shrink-0 shadow-xs">
                        54
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Speakers panel */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {/* Dedicated Premium Header Banner when browsing the Premium Voices section */}
              {selectedLang === "premium" && (
                <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-charcoal">PREMIUM VOICES</h3>
                        <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          KOKORO-82M
                        </span>
                      </div>
                      <p className="text-xs text-subtext mt-0.5">
                        High-fidelity, studio grade neural speech synthesis • 54 Expressive Voices
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
                    54 Voices
                  </span>
                </div>
              )}

              {/* Render Regions & Voices */}
              {currentLanguage?.regions.map((region) => {
                const premiumVoices = region.voices.filter((v) => v.isPremium || v.engine === "kokoro");
                const standardVoices = region.voices.filter((v) => !v.isPremium && v.engine !== "kokoro");

                return (
                  <div key={region.code} className="mb-5 last:mb-1">
                    {/* Region Header (only if not on the main premium language or if multiple regions) */}
                    <div className="flex items-center justify-between mb-2.5 px-1 border-b border-gray-100 pb-1">
                      <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                        <span>{region.label}</span>
                      </h4>
                      <span className="text-[10px] text-muted font-mono">
                        {region.voices.length} voice{region.voices.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* ═══ SEPARATE SPEAKERS SECTION: PREMIUM VOICES ═══ */}
                    {premiumVoices.length > 0 && (
                      <div className="mb-3.5">
                        {selectedLang !== "premium" && (
                          <div className="flex items-center gap-1.5 px-1 mb-2">
                            <span className="text-xs">👑</span>
                            <h5 className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">
                              Premium Voices ({premiumVoices.length})
                            </h5>
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              Kokoro Studio HQ
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {premiumVoices.map(renderVoiceCard)}
                        </div>
                      </div>
                    )}

                    {/* ═══ STANDARD NEURAL VOICES SECTION ═══ */}
                    {standardVoices.length > 0 && (
                      <div>
                        {premiumVoices.length > 0 && (
                          <div className="flex items-center gap-1 px-1 mb-2 mt-3">
                            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                              Standard Neural Voices ({standardVoices.length})
                            </h5>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {standardVoices.map(renderVoiceCard)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
