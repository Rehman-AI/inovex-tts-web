"use client";

import { useState, useCallback, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import VoiceSelector from "@/components/VoiceSelector";
import AudioPlayer from "@/components/AudioPlayer";

/* ─── Sidebar Nav Item ───────────────────────────────────────── */
function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
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
    </button>
  );
}

/* ─── Studio Page ────────────────────────────────────────────── */
export default function StudioPage() {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("en-US-JennyNeural");
  const [ratePct, setRatePct] = useState(0);
  const [pitchHz, setPitchHz] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stability, setStability] = useState(75);
  const [clarity, setClarity] = useState(88);
  const MAX_CHARS = 10000;
  const [charsRemaining, setCharsRemaining] = useState(MAX_CHARS);

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
    }
  }, [session]);

  const charCount = text.length;

  const handleGenerate = useCallback(async () => {
    if (!session) {
      signIn("google");
      return;
    }
    
    if (!text.trim()) return;
    if (charCount > charsRemaining) {
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

      const newRemaining = charsRemaining - charCount;
      setCharsRemaining(newRemaining);
      if (session?.user?.email) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        localStorage.setItem(`chars_${session.user.email}`, JSON.stringify({ remaining: newRemaining, month: currentMonth }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [text, voice, ratePct, pitchHz]);

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
            <span className="text-muted font-mono">10,000 / 10,000</span>
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
            <SidebarItem
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              label="Voice Library"
            />
            <SidebarItem
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              }
              label="Studio"
            />
            <SidebarItem
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              }
              label="Sound Effects"
            />
            <SidebarItem
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
              label="Voice Cloning"
              badge="NEW"
            />
          </div>
        </div>

        {/* Workspace Section */}
        <div className="mt-6 px-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] px-1 mb-2">WORKSPACE</p>
          <div className="space-y-0.5">
            <SidebarItem
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Pricing & Credits"
            />
            <SidebarItem
              icon={
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="History"
            />
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
          <AudioPlayer audioUrl={audioUrl} isGenerating={isGenerating} />
        </div>
      </main>

      {/* ═══ RIGHT PANEL ═══════════════════════════════════ */}
      <aside className="studio-right-panel p-4 hidden lg:block">
        {/* Voice Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Voice Controls</h3>
          </div>

          {/* Stability */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal">Stability</span>
              <span className="text-sm font-bold text-accent">{stability}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stability}
              onChange={(e) => setStability(parseInt(e.target.value))}
              className="slider-track"
            />
          </div>

          {/* Clarity + Similarity */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal">Clarity + Similarity Boost</span>
              <span className="text-sm font-bold text-accent">{clarity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={clarity}
              onChange={(e) => setClarity(parseInt(e.target.value))}
              className="slider-track"
            />
          </div>
        </div>

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
            {["MP3", "WAV", "OGG"].map((fmt, i) => (
              <button
                key={fmt}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  i === 0
                    ? "bg-accent text-white"
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
              { label: "Characters Used", value: `${charCount.toLocaleString()} / 10,000` },
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
    </div>
  );
}
