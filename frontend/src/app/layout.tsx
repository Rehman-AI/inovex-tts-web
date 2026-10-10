import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inovex AI — Neural Text-to-Speech with Human Emotion",
  description:
    "Synthesize human emotion into voice in real-time. 400+ neural voices, sub-60ms latency, emotion tags, voice cloning, and native Pakistani dialect support.",
  keywords: ["text to speech", "TTS", "AI voice", "neural speech", "Inovex AI", "voice cloning", "emotion synthesis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* Navbar */}
        <nav className="navbar sticky top-0 z-50 px-6 h-16 flex items-center" id="main-nav">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                              shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-charcoal tracking-tight">
                  Inovex
                </span>
                <span className="text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded">AI</span>
              </div>
            </a>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Synthesis", href: "/studio" },
                { label: "Voice Library", href: "/studio" },
                { label: "Voice Cloning", href: "#" },
                { label: "Pricing", href: "/#pricing" },
                { label: "API", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3.5 py-2 text-sm font-medium text-subtext hover:text-charcoal transition-colors rounded-lg hover:bg-gray-50"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent/5 rounded-lg">
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-xs font-semibold text-accent">10,000</span>
                <span className="text-xs text-muted">Free Chars / mo</span>
              </div>

              <button className="btn-secondary text-sm py-2 px-4 hidden sm:inline-flex">
                Sign in with Google
              </button>

              <a
                href="/studio"
                className="btn-primary text-sm py-2 px-5"
              >
                Open Studio
              </a>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
