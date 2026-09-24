"use client";

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import VoiceSelector from "@/components/VoiceSelector";
import AudioPlayer from "@/components/AudioPlayer";

export default function Home() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("en-US-JennyNeural");
  const [ratePct, setRatePct] = useState(0);
  const [pitchHz, setPitchHz] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [text, voice, ratePct, pitchHz]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-extrabold text-charcoal mb-3 tracking-tight">
          Convert Text to{" "}
          <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
            Speech
          </span>
        </h1>
        <p className="text-subtext text-lg max-w-xl mx-auto">
          Generate high-fidelity AI audio with 400+ neural voices across 100+ languages.
          Instantly.
        </p>
      </div>

      {/* Main Generator Card */}
      <div className="glass-card p-6 md:p-8 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
        {/* Voice Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Select Voice
          </label>
          <VoiceSelector selectedVoice={voice} onVoiceChange={setVoice} />
        </div>

        {/* Sliders Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Speed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-charcoal">Speed</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-accent font-bold">
                  {ratePct > 0 ? `+${ratePct}` : ratePct}%
                </span>
                <button
                  onClick={() => setRatePct(0)}
                  className="text-xs text-gray-400 hover:text-accent transition-colors"
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
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-charcoal">Pitch</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-accent font-bold">
                  {pitchHz > 0 ? `+${pitchHz}` : pitchHz}Hz
                </span>
                <button
                  onClick={() => setPitchHz(0)}
                  className="text-xs text-gray-400 hover:text-accent transition-colors"
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
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-charcoal">Text Input</label>
            <span className="text-xs text-gray-400">Output: MP3 (320 kbps)</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to create high-quality, natural-sounding audio..."
            className="text-input"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setText("")}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Clear text
            </button>
            <span className="text-xs font-mono font-medium text-gray-400">
              {charCount.toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!text.trim() || isGenerating}
          className="btn-generate w-full text-lg"
        >
          {isGenerating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              Generate Speech
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fadeIn">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Audio Player */}
      <AudioPlayer audioUrl={audioUrl} isGenerating={isGenerating} />

      {/* Footer */}
      <footer className="text-center mt-12 text-xs text-gray-400">
        <p>
          © {new Date().getFullYear()} Inovex TTS • All rights reserved •{" "}
          <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a> •{" "}
          <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
        </p>
      </footer>
    </main>
  );
}
