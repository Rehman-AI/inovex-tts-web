import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

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
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
