"use client";

import { useState, useEffect, useMemo } from "react";
import { Language, Voice, organizeVoices } from "@/data/voices";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

export default function VoiceSelector({ selectedVoice, onVoiceChange }: VoiceSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch(`${API_URL}/api/voices`);
        const data = await res.json();
        const organized = organizeVoices(data);
        setLanguages(organized);
      } catch {
        // Fallback: use a minimal set
        console.error("Failed to fetch voices from backend");
      } finally {
        setLoading(false);
      }
    }
    fetchVoices();
  }, []);

  const currentLanguage = useMemo(
    () => languages.find((l) => l.code === selectedLang),
    [languages, selectedLang]
  );

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return languages;
    const q = searchQuery.toLowerCase();
    return languages.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.regions.some((r) =>
          r.voices.some((v) => v.displayName.toLowerCase().includes(q))
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

  return (
    <div className="relative">
      {/* Selected voice button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-4 flex items-center justify-between cursor-pointer 
                   hover:shadow-lg transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedVoiceData?.lang.flag || "🌐"}</span>
          <div className="text-left">
            <p className="font-semibold text-charcoal">
              {selectedVoiceData?.voice.displayName || "Select Voice"}
            </p>
            <p className="text-sm text-gray-500">
              {selectedVoiceData?.lang.label} ({selectedVoiceData?.region.label}) •{" "}
              {selectedVoiceData?.voice.gender === "Female" ? "👩" : "👨"}{" "}
              {selectedVoiceData?.voice.gender}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full shadow-2xl rounded-2xl overflow-hidden
                        border border-gray-200 max-h-[500px] flex flex-col animate-fadeIn"
             style={{ background: "rgba(255, 255, 255, 0.97)", backdropFilter: "blur(20px)" }}>
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search voices or languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-charcoal
                         placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent/30
                         transition-all text-sm"
            />
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Language list (sidebar) */}
            <div className="w-48 border-r border-gray-100 overflow-y-auto scrollbar-thin">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2
                              transition-all duration-150 hover:bg-accent/5
                              ${selectedLang === lang.code
                                ? "bg-accent/10 text-accent font-semibold border-r-2 border-accent"
                                : "text-gray-600"
                              }`}
                >
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.label}</span>
                </button>
              ))}
            </div>

            {/* Speakers for selected language */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
              {currentLanguage?.regions.map((region) => (
                <div key={region.code} className="mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                    {region.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {region.voices.map((voice) => (
                      <button
                        key={voice.name}
                        onClick={() => {
                          onVoiceChange(voice.name);
                          setIsOpen(false);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150
                                    flex items-center gap-2 group/voice
                                    ${selectedVoice === voice.name
                                      ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-md"
                                      : "hover:bg-gray-50 text-gray-700"
                                    }`}
                      >
                        <span className="text-base">
                          {voice.gender === "Female" ? "👩" : "👨"}
                        </span>
                        <div>
                          <p className="font-medium leading-tight">{voice.displayName}</p>
                          <p className={`text-xs leading-tight ${
                            selectedVoice === voice.name ? "text-white/70" : "text-gray-400"
                          }`}>
                            {voice.gender}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
