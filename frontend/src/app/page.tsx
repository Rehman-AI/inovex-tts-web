"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}

/* ─── Waveform animation component ───────────────────────────── */
function WaveformBars({ active = false }: { active?: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-6">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className={`w-[2.5px] rounded-full transition-all duration-300 ${
            active ? "bg-accent" : "bg-gray-300"
          }`}
          style={{
            height: active
              ? `${Math.random() * 18 + 6}px`
              : `${Math.sin(i * 0.5) * 6 + 8}px`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Interactive Console Preview ────────────────────────────── */
function ConsolePreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const voices = [
    { name: "Christopher", avatar: "CH", color: "#1D4ED8", demoVoice: "en-US-ChristopherNeural" },
    { name: "Aria", avatar: "AR", color: "#7C3AED", demoVoice: "en-US-AriaNeural" },
    { name: "Sonia", avatar: "SO", color: "#059669", demoVoice: "en-GB-SoniaNeural" },
    { name: "Uzma", avatar: "UZ", color: "#E11D48", demoVoice: "ur-PK-UzmaNeural" },
  ];

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        audioRef.current.src = `/demos/${voices[activeIndex].demoVoice}.mp3`;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/demos/${voices[activeIndex].demoVoice}.mp3`;
    link.download = `${voices[activeIndex].name}_Inovex_Demo.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="console-preview max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="topbar">
        <div className="dot bg-red-400" />
        <div className="dot bg-yellow-400" />
        <div className="dot bg-green-400" />
        <span className="ml-3 text-xs font-medium text-muted">🔊 Interactive Acoustic Console</span>
        <span className="ml-auto text-xs text-muted">voices v4.2 — emotive</span>
      </div>

      {/* Console body */}
      <div className="p-6 pb-5">
        {/* Voice chips */}
        <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-2">
          {voices.map((v, i) => (
            <button
              key={v.name}
              onClick={() => {
                setActiveIndex(i);
                if (isPlaying && audioRef.current) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
                          transition-all duration-300 cursor-pointer
                          ${activeIndex === i
                            ? "bg-accent text-white shadow-md shadow-accent/20"
                            : "bg-gray-50 text-charcoal hover:bg-gray-100 border border-border"
                          }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                style={{ background: v.color }}
              >
                {v.avatar}
              </span>
              {v.name}
            </button>
          ))}
        </div>

        {/* Text preview */}
        <div className="bg-bg-alt rounded-xl p-5 mb-4 border border-border">
          <p className="text-sm leading-relaxed text-charcoal">
            Let me tell you something. I&apos;ve been in this business twenty years.
            I&apos;ve seen trends come and go, I&apos;ve seen people bet everything on the wrong thing, and
            I&apos;ve been right about enough of it to know when something is different.
            Actually my guys will tell you I never say it.
          </p>
        </div>

        {/* Waveform + controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full bg-green-500 ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying ? 'Playing' : 'Ready'}
          </div>
          <span className="text-xs text-muted font-mono">0:27</span>
          <div className="flex-1">
            <WaveformBars />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              title="Download MP3"
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-accent/10 hover:text-accent transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button 
              onClick={handlePlay}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-accent/10 hover:text-accent transition-all">
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>

        {/* Bottom stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>🔊 Inovex v4 Neural</span>
            <span>Latency: <span className="text-green-600 font-semibold">48.7ms</span></span>
          </div>
          <div className="flex items-center gap-1">
            {["H", "I", "G", "H"].map((letter, i) => (
              <span key={i} className="w-5 h-5 rounded bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ─────────────────────────────────────── */
export default function LandingPage() {
  useReveal();

  const features = [
    {
      icon: "🧠",
      title: "Contextual Emotion Engine",
      description: "Direct emotion into your content from anger, joy, sadness, empathy, and sarcasm via simple text tags — no re-recording, no complex integration.",
      badge: "CORE ENGINE",
      link: "LEARN MORE →",
    },
    {
      icon: "⚡",
      title: "Sub-60ms Stream Streaming",
      description: "Stream synthesis in under 60 milliseconds per chunk for real-time applications. Synthesis speed that matches live human conversational pacing.",
      badge: "FULL SUPER REALTIME",
      link: "LATENCY REFERENCE →",
    },
    {
      icon: "🎭",
      title: "Zero-Shot Voice Cloning",
      description: "Create a synthetic voice from just 3 seconds of clean audio. Match accent, tone, and personality instantly.",
      badge: "3 SECONDS OF AUDIO",
      link: "QUALITY REFERENCE →",
    },
    {
      icon: "🌙",
      title: "Urdu & South Asian Dialects",
      description: "Native fluency in Punjabi, Sindhi, Balochi, Pashto, and more — with frame-accurate emotive pacing and cultural intonation.",
      badge: "NATIVE SYNTHESIS",
      link: "ALL DIALECTS →",
    },
  ];

  const voiceArtists = [
    { name: "Christopher", style: "Deep, Cinematic", accent: "American", avatar: "CH", color: "#1D4ED8", uses: "142.5K", demoVoice: "en-US-ChristopherNeural" },
    { name: "Aria", style: "Expressive, Bright", accent: "American", avatar: "AR", color: "#7C3AED", uses: "118.2K", demoVoice: "en-US-AriaNeural" },
    { name: "Sonia", style: "Elegant, Professional", accent: "British", avatar: "SO", color: "#059669", uses: "89.4K", demoVoice: "en-GB-SoniaNeural" },
    { name: "Uzma", style: "Clear, Conversational", accent: "Urdu (Pakistani)", avatar: "UZ", color: "#E11D48", uses: "65.1K", demoVoice: "ur-PK-UzmaNeural" },
  ];

  const pricing = [
    {
      name: "Starter",
      price: "Rs 0",
      period: "/month",
      badge: null,
      features: ["10,000 characters free monthly", "Access to 400+ Neural voices", "Community-tier TTS voices", "10-minute max streaming"],
      cta: "Start Free",
      featured: false,
    },
    {
      name: "Creator Pack",
      price: "Rs 1,500",
      period: "PKR / mo",
      badge: "1 Lac Chars",
      features: ["100,000 characters (≈1.5 hrs)", "Top Premium License Voices", "8 Premier Voice Identities", "Priority Queue Access"],
      cta: "Unlock Pro",
      featured: false,
    },
    {
      name: "Pro Creator",
      price: "Rs 2,000",
      period: "PKR / mo",
      badge: "MOST POPULAR",
      features: ["500,000 characters / month", "Instant Voice Cloning (3 slots)", "Low-Latency Professional Audio", "Studio-Tier Priority Routing"],
      cta: "Start Pro Studio",
      featured: true,
    },
    {
      name: "Enterprise Ultra",
      price: "Rs 2,500",
      period: "PKR / mo",
      badge: "10 Lac Chars",
      features: ["1,000,000 characters (≈16 hrs)", "Unlimited Concurrent Streams", "Dedicated Queue + Webhooks", "Extended Historical Access"],
      cta: "Buy Ultra",
      featured: false,
    },
  ];

  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <>
      {/* ═══════════════════ HERO SECTION ═══════════════════════ */}
      <section className="hero-section pt-8 pb-20 md:pt-16 md:pb-32">
        {/* Background video */}
        <video
          ref={videoRef}
          className="hero-video-bg"
          autoPlay
          loop
          muted
          playsInline
          poster=""
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-sound-waves-visualization/1080p.mp4"
            type="video/mp4"
          />
        </video>
        <div className="hero-overlay" />

        <div className="hero-content max-w-6xl mx-auto px-6">
          {/* Top badges */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fadeIn">
            <span className="badge badge-blue">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Neural v4 Live
            </span>
            <span className="badge badge-green">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Sub-60ms Latency
            </span>
            <span className="badge badge-purple">
              400+ Voices
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-8 animate-fadeInUp">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-charcoal leading-[1.1] tracking-tight mb-6">
              Synthesize{" "}
              <span className="text-gradient">Human Emotion</span>
              <br />
              into Voice in Real-Time.
            </h1>
            <p className="text-lg md:text-xl text-subtext max-w-2xl mx-auto leading-relaxed">
              The next-generation neural acoustic engine with industry-first emotive inflections,
              sub-60ms latency, and native Pakistani & South Asian voice dubbing.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16 animate-fadeInUp" style={{ animationDelay: "0.15s" }}>
            <Link href="/studio" className="btn-primary text-base px-8 py-3.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Launch Studio for Free
            </Link>
            <button
              onClick={() => document.getElementById('voice-artists')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-base px-8 py-3.5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Listen to Demos
            </button>
          </div>

          {/* Console Preview */}
          <div className="animate-scaleIn" style={{ animationDelay: "0.25s" }}>
            <ConsolePreview />
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUST BAND ════════════════════════ */}
      <section className="py-16 bg-bg-alt border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-4">
                Trusted by 45,000+ creators,
                <br />game studios, and AI agent
                <br />developers.
              </h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex -space-x-2">
                  {["#2563EB", "#7C3AED", "#059669", "#DC2626", "#F59E0B"].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: color, zIndex: 5 - i }}
                    >
                      {["A", "B", "C", "D", "E"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-0.5">4.58 / 5.0 <span className="text-charcoal font-medium">on 4,200+ reviews</span></p>
                </div>
              </div>
            </div>

            <div className="md:w-1/2">
              <div className="bg-surface rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">BENCHMARK: REAL-TO-FIRST-CHUNK (TTFC)</p>
                <div className="space-y-3">
                  {[
                    { name: "Inovex Neural v4", val: "48ms", w: "18%", accent: true },
                    { name: "Competitor A", val: "240ms", w: "55%", accent: false },
                    { name: "Competitor B", val: "380ms", w: "80%", accent: false },
                    { name: "Industry Average", val: "450ms", w: "100%", accent: false },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={item.accent ? "text-accent font-semibold" : "text-muted"}>{item.name}</span>
                        <span className={item.accent ? "text-accent font-bold" : "text-charcoal font-medium"}>{item.val}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${item.accent ? "bg-accent" : "bg-gray-300"}`}
                          style={{ width: item.w }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ══════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <p className="text-xs font-bold text-accent uppercase tracking-[0.15em] mb-3">ARCHITECTURAL SUPREMACY</p>
            <h2 className="text-3xl md:text-5xl font-bold text-charcoal leading-tight mb-4">
              Engineered for Hyper-Realistic Inflection
              <br />and Micro-Latency
            </h2>
            <p className="text-subtext text-lg max-w-2xl mx-auto">
              Skip prototyping in flat, robotic sentences. Ship products that sound expressive and direct without an
              engine overhaul.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="feature-card reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-lg font-bold text-charcoal mb-2">{f.title}</h3>
                <p className="text-sm text-subtext leading-relaxed mb-4">{f.description}</p>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{f.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ VOICE ARTISTS ════════════════════ */}
      <section className="py-20 bg-bg-alt" id="voice-artists">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12 reveal">
            <div>
              <p className="text-xs font-bold text-accent uppercase tracking-[0.15em] mb-2">PRE-BUILT VOICE ASSETS</p>
              <h2 className="text-3xl md:text-4xl font-bold text-charcoal">
                Curated Studio Identities Ready
                <br />for Immediate Dubbing
              </h2>
            </div>
            <Link href="/studio" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              All Voices →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {voiceArtists.map((artist, i) => (
              <div
                key={artist.name}
                className="voice-artist-card reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="artist-image">
                  <span
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: artist.color }}
                  >
                    {artist.avatar}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-charcoal">{artist.name}</h3>
                    <span className="text-xs text-muted">{artist.uses} uses</span>
                  </div>
                  <p className="text-sm text-subtext mb-3">{artist.style}, {artist.accent}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const audio = new Audio(`/demos/${artist.demoVoice}.mp3`);
                        audio.play().catch(() => {});
                      }}
                      className="flex-1 btn-primary text-xs py-2 justify-center rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Demo
                    </button>
                    <Link href="/studio" className="flex-1 btn-secondary text-xs py-2 justify-center rounded-lg">
                      Use Voice
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ══════════════════════════ */}
      <section className="py-20 md:py-28" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-5xl font-bold text-charcoal mb-4">
              Transparent PKR & Global Pricing
            </h2>
            <p className="text-subtext text-lg max-w-xl mx-auto">
              No frills or hidden charges. Instant settlement via Easypaisa, JazzCash, or direct card.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="badge badge-green">MOST POPULAR</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pricing.map((plan, i) => (
              <div
                key={plan.name}
                className={`pricing-card reveal ${plan.featured ? "featured" : ""}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-charcoal uppercase tracking-wide">{plan.name}</span>
                  {plan.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      plan.featured
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-muted"
                    }`}>{plan.badge}</span>
                  )}
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-charcoal">{plan.price}</span>
                  <span className="text-sm text-muted ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-subtext">
                      <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/studio"
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer text-center block ${
                  plan.featured
                    ? "btn-primary justify-center"
                    : "border border-border text-charcoal hover:border-accent hover:text-accent"
                }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="flex items-center justify-center gap-6 mt-10 text-xs text-muted reveal">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              Instant Settlement via Pakistani Financial Rails
            </span>
            <span>💳 Easypaisa</span>
            <span>📱 JazzCash</span>
            <span>💳 Visa / MC</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ══════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 reveal">
          <div className="cta-section px-8 md:px-16 py-14 md:py-20 text-center relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 relative z-10">
              Ready to build with synthetic acoustic
              <br />intelligence?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto relative z-10">
              Start generating studio-grade voices at zero cost, or integrate via our API in minutes.
            </p>
            <div className="flex items-center justify-center gap-4 relative z-10">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-accent font-semibold rounded-xl
                           hover:bg-white/90 transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Try the Studio
              </Link>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl
                                  hover:bg-white/10 transition-all duration-200">
                📄 API Docs
              </button>
            </div>

            <p className="text-white/50 text-xs mt-8 relative z-10">
              © 2025 Inovex AI LLC • All rights reserved
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════════════ */}
      <footer className="site-footer py-12 mt-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </div>
                <span className="font-bold text-white">Inovex<span className="text-accent-light"> AI</span></span>
              </div>
              <p className="text-xs leading-relaxed text-white/50">
                Powering high-emotion neural speech synthesis,
                with sub-60ms latency, across 60+ regional dialects
                for the global creator collective.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">SYNTHESIS PLATFORM</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/studio">Speech Studio</Link></li>
                <li><Link href="/studio">Voice Library</Link></li>
                <li><Link href="/studio">Voice Cloning</Link></li>
                <li><Link href="/studio">Sound Effects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">DEVELOPERS</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/studio">API Reference v4</Link></li>
                <li><Link href="/studio">SDK & Libraries</Link></li>
                <li><Link href="/studio">Webhooks</Link></li>
                <li><Link href="/studio">Status Page</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">PAYMENTS & SETTLEMENT</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#pricing">Easypaisa</Link></li>
                <li><Link href="/#pricing">JazzCash</Link></li>
                <li><Link href="/#pricing">Visa / Mastercard</Link></li>
                <li><Link href="/#pricing">Enterprise Invoicing</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-white/40">
            <p>© 2025 Inovex AI LLC. All rights reserved. All product names & trademarks are property of their respective holders.</p>
            <div className="flex gap-4 mt-3 md:mt-0">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
