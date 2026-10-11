"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import VoiceSelector from "@/components/VoiceSelector";
import AudioPlayer from "@/components/AudioPlayer";
import { saveAudioBlob, getAudioBlob, clearAllAudioBlobs } from "@/utils/indexedDB";
import { isUnlimitedUser } from "@/utils/userPlan";

/* ─── Featured / Suggested Voices ────────────────────────────── */
const FEATURED_VOICES = [
  {
    name: "en-US-AndrewNeural",
    displayName: "Andrew",
    style: "Deep, Warm & Authoritative",
    accent: "American",
    avatar: "AN",
    color: "#1D4ED8",
    badge: "⭐ RECOMMENDED",
    description: "A confident, deep male voice with natural warmth — perfect for narrations, podcasts, explainers, and professional voiceovers.",
    featured: true,
  },
  {
    name: "en-US-AriaNeural",
    displayName: "Aria",
    style: "Expressive & Bright",
    accent: "American",
    avatar: "AR",
    color: "#7C3AED",
    badge: "POPULAR",
    description: "Versatile and engaging female voice for creative content.",
    featured: false,
  },
  {
    name: "en-US-ChristopherNeural",
    displayName: "Christopher",
    style: "Deep & Cinematic",
    accent: "American",
    avatar: "CH",
    color: "#059669",
    badge: "CINEMATIC",
    description: "Rich cinematic tone ideal for trailers and dramatic content.",
    featured: false,
  },
  {
    name: "en-GB-SoniaNeural",
    displayName: "Sonia",
    style: "Elegant & Professional",
    accent: "British",
    avatar: "SO",
    color: "#E11D48",
    badge: "BRITISH",
    description: "Refined British voice for professional and corporate use.",
    featured: false,
  },
];

/* ─── Sidebar Nav Item ───────────────────────────────────────── */
function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-nav-item w-full ${active ? "active" : ""}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
      {trailing}
    </button>
  );
}

/* ─── Studio Page ────────────────────────────────────────────── */
export default function StudioPage() {
  const { data: session } = useSession();
  const isVIP = isUnlimitedUser(session?.user?.email);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("en-US-AndrewNeural");
  const [ratePct, setRatePct] = useState(0);
  const [pitchHz, setPitchHz] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<"mp3" | "wav">("mp3");
  const MAX_CHARS = 10000;
  const [charsRemaining, setCharsRemaining] = useState(MAX_CHARS);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<{id: string, text: string, voice: string, date: string}[]>([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSuggestionVoice, setPlayingSuggestionVoice] = useState<string | null>(null);
  const suggestionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
      const stored = localStorage.getItem(`chars_${session.user.email}`);
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.month !== currentMonth) {
            // Reset for new month
            const newData = { remaining: MAX_CHARS, month: currentMonth };
            localStorage.setItem(`chars_${session.user.email}`, JSON.stringify(newData));
            setCharsRemaining(MAX_CHARS);
          } else {
            setCharsRemaining(data.remaining);
          }
        } catch (e) {
          // Fallback for old simple string format
          const newData = { remaining: parseInt(stored), month: currentMonth };
          localStorage.setItem(`chars_${session.user.email}`, JSON.stringify(newData));
          setCharsRemaining(newData.remaining);
        }
      } else {
        const newData = { remaining: MAX_CHARS, month: currentMonth };
        localStorage.setItem(`chars_${session.user.email}`, JSON.stringify(newData));
        setCharsRemaining(MAX_CHARS);
      }

      // Load History
      const hist = localStorage.getItem(`audio_history_${session.user.email}`);
      if (hist) {
        try { setHistoryItems(JSON.parse(hist)); } catch(e) {}
      }
    }
  }, [session]);

  const handleTogglePlayHistory = async (e: React.MouseEvent, item: { id: string; text: string; voice: string }) => {
    e.stopPropagation();
    if (playingHistoryId === item.id) {
      historyAudioRef.current?.pause();
      setPlayingHistoryId(null);
    } else {
      if (item.id) {
        const blob = await getAudioBlob(item.id);
        if (blob && historyAudioRef.current) {
          historyAudioRef.current.src = URL.createObjectURL(blob);
          historyAudioRef.current.play().catch(() => setPlayingHistoryId(null));
          setPlayingHistoryId(item.id);
        } else {
          alert("Audio file not found in browser storage.");
        }
      }
    }
  };

  const handleDownloadHistoryItem = async (e: React.MouseEvent, item: { id: string; text: string; voice: string }) => {
    e.stopPropagation();
    try {
      const blob = await getAudioBlob(item.id);
      if (!blob) {
        alert("Audio file not found in browser storage.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const voiceShort = item.voice.split("-").pop() || "speech";
      const cleanText = item.text.slice(0, 25).replace(/[^a-zA-Z0-9]/g, "_") || "audio";
      a.download = `inovex_${voiceShort}_${cleanText}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download audio:", err);
      alert("Failed to download audio file.");
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = historyItems.filter((h) => h.id !== id);
    setHistoryItems(updated);
    if (session?.user?.email) {
      localStorage.setItem(`audio_history_${session.user.email}`, JSON.stringify(updated));
    }
    if (playingHistoryId === id) {
      historyAudioRef.current?.pause();
      setPlayingHistoryId(null);
    }
  };

  const handleClearAllHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Clear all generation history and audio files?")) {
      setHistoryItems([]);
      if (session?.user?.email) {
        localStorage.removeItem(`audio_history_${session.user.email}`);
      }
      await clearAllAudioBlobs();
      if (playingHistoryId) {
        historyAudioRef.current?.pause();
        setPlayingHistoryId(null);
      }
    }
  };

  const charCount = text.length;

  const handleGenerate = useCallback(async () => {
    if (!session) {
      signIn("google");
      return;
    }
    
    if (!text.trim()) return;
    if (!isVIP && charCount > charsRemaining) {
      setError("Not enough characters remaining. Please upgrade your plan or use shorter text.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const res = await fetch(`${API_URL}/api/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice,
          rate_pct: ratePct,
          pitch_hz: pitchHz,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(data.detail || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (!isVIP) {
        const newRemaining = Math.max(0, charsRemaining - charCount);
        setCharsRemaining(newRemaining);
      }
      
      const id = Date.now().toString();
      await saveAudioBlob(id, blob);

      const newHistory = [{ id, text: text.trim().substring(0, 150), voice, date: new Date().toLocaleString() }, ...historyItems].slice(0, 50);
      setHistoryItems(newHistory);

      if (session?.user?.email) {
        if (!isVIP) {
          const currentMonth = new Date().toISOString().slice(0, 7);
          const newRemaining = Math.max(0, charsRemaining - charCount);
          localStorage.setItem(`chars_${session.user.email}`, JSON.stringify({ remaining: newRemaining, month: currentMonth }));
          window.dispatchEvent(new Event('chars-updated'));
        }
        localStorage.setItem(`audio_history_${session.user.email}`, JSON.stringify(newHistory));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [text, voice, ratePct, pitchHz, session, isVIP, charsRemaining, charCount, historyItems]);

  const insertTag = (tag: string) => {
    setText((prev) => prev + `[${tag}] `);
  };

  return (
    <div className="studio-layout">
      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════ */}
      <aside className="studio-sidebar">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-charcoal">Inovex</span>
              <span className="text-[9px] font-bold text-accent ml-1 bg-accent/10 px-1 py-0.5 rounded">AI</span>
              <p className="text-[10px] text-muted uppercase tracking-wider leading-none mt-0.5">SPEECH STUDIO</p>
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="mx-3 mt-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded font-mono">Neural v4 Live</span>
          </div>
          <p className="text-[11px] text-subtext leading-snug">
            Ultra-emotive real-time synthesis with contextual emotion tags.
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="text-accent font-semibold cursor-pointer hover:underline">Try live benchmark →</span>
            <span className="text-muted font-mono">{isVIP ? "∞ Unlimited VIP" : `${charsRemaining.toLocaleString()} / 10,000`}</span>
          </div>
        </div>

        {/* Audio Synthesis Section */}
        <div className="mt-4 px-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] px-1 mb-2">AUDIO SYNTHESIS</p>
          <div className="space-y-0.5">
            <SidebarItem
              active
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              }
              label="Text to Speech"
            />
          </div>
        </div>

        {/* Workspace Section */}
        <div className="mt-6 px-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] px-1 mb-2">WORKSPACE</p>
          <div className="space-y-1">
            <SidebarItem
              active={showHistory}
              onClick={() => setShowHistory(!showHistory)}
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="History"
              badge={historyItems.length > 0 ? `${historyItems.length}` : undefined}
              trailing={
                <svg
                  className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                    showHistory ? "rotate-180 text-accent" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              }
            />

            {/* Slide Down Bar with All History */}
            {showHistory && (
              <div className="mt-2 p-2.5 rounded-xl bg-surface border border-border shadow-xs animate-fadeIn space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-[11px] font-bold text-charcoal flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Saved Clips ({historyItems.length})
                  </span>
                  {historyItems.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      className="text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                      title="Clear all history"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {historyItems.length === 0 ? (
                  <div className="text-center py-5 px-1">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1.5 text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-[11px] font-medium text-subtext">No history yet</p>
                    <p className="text-[10px] text-muted mt-0.5">Generate speech to view and download audio.</p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {historyItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border border-border bg-bg-alt hover:bg-surface hover:border-accent/40 hover:shadow-xs transition-all text-left"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded leading-none truncate max-w-[95px]">
                            {item.voice.split("-").pop() || item.voice}
                          </span>
                          <span className="text-[9px] text-muted font-mono whitespace-nowrap">
                            {item.date.split(",")[0] || item.date}
                          </span>
                        </div>

                        <p
                          className="text-[11px] text-charcoal line-clamp-2 leading-snug mb-2 font-normal cursor-pointer hover:text-accent"
                          title={`Click to load into editor: "${item.text}"`}
                          onClick={() => setText(item.text)}
                        >
                          "{item.text}"
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          {/* Play / Pause */}
                          <button
                            onClick={(e) => handleTogglePlayHistory(e, item)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                              playingHistoryId === item.id
                                ? "bg-accent text-white"
                                : "bg-surface text-subtext hover:text-accent hover:bg-accent/10 border border-border"
                            }`}
                            title={playingHistoryId === item.id ? "Pause" : "Play"}
                          >
                            {playingHistoryId === item.id ? (
                              <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                <span>Play</span>
                              </>
                            )}
                          </button>

                          {/* Action icons: Download & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDownloadHistoryItem(e, item)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-accent text-white hover:bg-accent-dark transition-colors shadow-xs"
                              title="Download audio file"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>Save</span>
                            </button>

                            <button
                              onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                              className="p-1 rounded text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete from history"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom - API Status */}
        <div className="mt-auto px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <div>
              <p className="text-xs font-semibold text-charcoal">API Engine v4.2</p>
              <p className="text-[10px] text-muted">Ultra-low <span className="text-green-600 font-semibold">48ms</span> synthesis latency active.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ══════════════════════════════════ */}
      <main className="studio-main p-6 md:p-8 pb-24">
        <div className="max-w-3xl mx-auto">
          {/* ─── Featured Voice Suggestion ─── */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-3">⭐ SUGGESTED VOICES</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURED_VOICES.map((fv) => (
                <div
                  key={fv.name}
                  className={`relative rounded-xl border p-4 transition-all duration-300 cursor-pointer group ${
                    voice === fv.name
                      ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                      : "border-border bg-surface hover:border-accent/40 hover:shadow-sm"
                  } ${fv.featured ? "sm:col-span-2" : ""}`}
                  onClick={() => setVoice(fv.name)}
                >
                  {/* Featured badge glow */}
                  {fv.featured && voice === fv.name && (
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-accent/20 via-blue-400/20 to-accent/20 blur-sm -z-10" />
                  )}

                  <div className={`flex items-start gap-4 ${fv.featured ? "sm:flex-row" : "flex-col"}`}>
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      <span
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                        style={{ background: fv.color }}
                      >
                        {fv.avatar}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-charcoal text-sm">{fv.displayName}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            fv.featured
                              ? "bg-accent text-white"
                              : "bg-gray-100 text-muted"
                          }`}>{fv.badge}</span>
                        </div>
                        <p className="text-xs text-subtext">{fv.style} • {fv.accent}</p>
                      </div>
                    </div>

                    {/* Description + actions (only for featured or on hover) */}
                    <div className={`flex-1 ${fv.featured ? '' : 'mt-1'}`}>
                      {fv.featured && (
                        <p className="text-xs text-subtext leading-relaxed mb-2 hidden sm:block">
                          {fv.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playingSuggestionVoice === fv.name) {
                              suggestionAudioRef.current?.pause();
                              setPlayingSuggestionVoice(null);
                            } else {
                              if (suggestionAudioRef.current) {
                                suggestionAudioRef.current.pause();
                              }
                              const audio = new Audio(`/demos/${fv.name}.mp3`);
                              suggestionAudioRef.current = audio;
                              setPlayingSuggestionVoice(fv.name);
                              audio.onended = () => setPlayingSuggestionVoice(null);
                              audio.onerror = () => setPlayingSuggestionVoice(null);
                              audio.play().catch(() => setPlayingSuggestionVoice(null));
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            playingSuggestionVoice === fv.name
                              ? "bg-accent text-white shadow-sm shadow-accent/20"
                              : "bg-gray-100 text-gray-600 hover:bg-accent/10 hover:text-accent"
                          }`}
                        >
                          {playingSuggestionVoice === fv.name ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z" />
                              </svg>
                              Stop
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              Preview
                            </>
                          )}
                        </button>
                        {voice === fv.name && (
                          <span className="flex items-center gap-1 text-[10px] text-accent font-semibold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Selector */}
          <div className="mb-6">
            <VoiceSelector selectedVoice={voice} onVoiceChange={setVoice} />
          </div>

          {/* Text Input */}
          <div className="mb-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              className="text-input"
              style={{ minHeight: "220px" }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setText("")}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                >
                  Clear text
                </button>
              </div>
              <span className={`text-xs font-mono font-medium ${charCount > charsRemaining ? 'text-red-500' : 'text-muted'}`}>
                ↻ {charCount.toLocaleString()} / {charsRemaining.toLocaleString()} characters remaining
              </span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Speed */}
            <div className="bg-bg-alt rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-charcoal">Speed</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-accent font-bold">
                    {ratePct > 0 ? `+${ratePct}` : ratePct}%
                  </span>
                  <button
                    onClick={() => setRatePct(0)}
                    className="text-xs text-muted hover:text-accent transition-colors"
                    title="Reset"
                  >
                    ↺
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={5}
                value={ratePct}
                onChange={(e) => setRatePct(parseInt(e.target.value))}
                className="slider-track"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>Slower</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="bg-bg-alt rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-charcoal">Pitch</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-accent font-bold">
                    {pitchHz > 0 ? `+${pitchHz}` : pitchHz}Hz
                  </span>
                  <button
                    onClick={() => setPitchHz(0)}
                    className="text-xs text-muted hover:text-accent transition-colors"
                    title="Reset"
                  >
                    ↺
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={5}
                value={pitchHz}
                onChange={(e) => setPitchHz(parseInt(e.target.value))}
                className="slider-track"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>Lower</span>
                <span>Higher</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || isGenerating}
            className="btn-generate w-full text-base"
          >
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Speech...
              </>
            ) : !session ? (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google to Generate
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                ✦ GENERATE SPEECH
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fadeIn">
              ⚠️ {error}
            </div>
          )}

          {/* Audio Player */}
          <AudioPlayer audioUrl={audioUrl} isGenerating={isGenerating} outputFormat={outputFormat} />
        </div>
      </main>

      {/* ═══ RIGHT PANEL ═══════════════════════════════════ */}
      <aside className="studio-right-panel p-4 hidden lg:block">


        {/* Synthesis Model */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Synthesis Model</span>
            <span className="text-[10px] text-accent font-semibold cursor-pointer hover:underline">Best practices ↗</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono">v4</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">Inovex v4 (Emotive)</p>
                <p className="text-[10px] text-green-600 font-medium">⚡ 120ms Latency</p>
              </div>
            </div>
          </div>
        </div>

        {/* Output Format */}
        <div className="mb-6">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-3">Output Format</span>
          <div className="flex gap-2">
            {(["MP3", "WAV"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setOutputFormat(fmt.toLowerCase() as "mp3" | "wav")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  outputFormat === fmt.toLowerCase()
                    ? "bg-accent text-white shadow-sm"
                    : "bg-gray-50 text-muted border border-border hover:border-accent hover:text-accent"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-bg-alt rounded-xl p-4 border border-border">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Session Stats</p>
          <div className="space-y-2">
            {[
              { label: "Account Plan", value: isVIP ? "VIP (Unlimited)" : "Free Tier" },
              { label: "Characters Used", value: isVIP ? `${charCount.toLocaleString()} (Unlimited)` : `${charCount.toLocaleString()} / 10,000` },
              { label: "Generations Today", value: audioUrl ? "1" : "0" },
              { label: "Avg. Latency", value: "48ms" },
              { label: "Queue Position", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-xs text-muted">{stat.label}</span>
                <span className="text-xs font-semibold text-charcoal">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Audio element for History playback */}
      <audio ref={historyAudioRef} onEnded={() => setPlayingHistoryId(null)} className="hidden" />
    </div>
  );
}
