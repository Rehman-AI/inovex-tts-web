import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inovex TTS — AI Text-to-Speech",
  description:
    "Generate natural, high-fidelity speech from text using 400+ neural voices across 100+ languages. Powered by Inovex TTS.",
  keywords: ["text to speech", "TTS", "AI voice", "neural speech", "Inovex TTS"],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-blobs antialiased">
        {/* Navbar */}
        <nav className="navbar sticky top-0 z-40 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light
                              flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-charcoal tracking-tight">
                Inovex <span className="text-accent">TTS</span>
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-charcoal transition-colors">
                Dashboard
              </a>
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-charcoal transition-colors">
                Library
              </a>
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-charcoal transition-colors">
                Pricing
              </a>
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-light
                                 text-white text-sm font-semibold shadow-md hover:shadow-lg
                                 hover:-translate-y-0.5 transition-all duration-200">
                Sign in with Google
              </button>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
