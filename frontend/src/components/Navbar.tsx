"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isUnlimitedUser } from "@/utils/userPlan";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [charsRemaining, setCharsRemaining] = useState(10000);
  const pathname = usePathname();
  const isVIP = isUnlimitedUser(session?.user?.email);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchChars = () => {
      if (session?.user?.email) {
        const stored = localStorage.getItem(`chars_${session.user.email}`);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (data.month === new Date().toISOString().slice(0, 7)) {
              setCharsRemaining(data.remaining);
            } else {
              setCharsRemaining(10000);
            }
          } catch(e) {
            setCharsRemaining(parseInt(stored));
          }
        } else {
          setCharsRemaining(10000);
        }
      }
    };
    
    fetchChars();
    window.addEventListener('storage', fetchChars);
    window.addEventListener('chars-updated', fetchChars);
    
    return () => {
      window.removeEventListener('storage', fetchChars);
      window.removeEventListener('chars-updated', fetchChars);
    };
  }, [session]);

  const navLinks = [
    { label: "Synthesis", href: "/studio" },
    { label: "Voice Library", href: "/studio" },
    { label: "Voice Cloning", href: "/studio" },
    { label: "Pricing", href: "/#pricing" },
    { label: "API", href: "/#pricing" },
  ];

  return (
    <nav className={`navbar sticky top-0 z-50 px-6 h-16 flex items-center ${scrolled ? "scrolled" : ""}`}>
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                          shadow-sm group-hover:shadow-md transition-shadow duration-200">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-charcoal tracking-tight">Inovex</span>
            <span className="text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded">AI</span>
          </div>
        </Link>

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 ${
                pathname === link.href ? "text-accent" : "text-subtext hover:text-charcoal"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Chars / VIP badge */}
          {isVIP ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                <span className="text-sm font-black leading-none">∞</span> Unlimited VIP
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent/5 rounded-lg">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-xs font-semibold text-accent">{charsRemaining.toLocaleString()}</span>
              <span className="text-xs text-muted">Free Chars / mo</span>
            </div>
          )}

          {/* Auth buttons */}
          {status === "loading" ? (
            <div className="w-20 h-9 rounded-lg bg-gray-100 animate-pulse" />
          ) : session ? (
            /* Logged in */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-border">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ""}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-charcoal hidden lg:inline max-w-[100px] truncate">
                  {session.user?.name || session.user?.email}
                </span>
              </div>

              <button
                onClick={() => signOut()}
                className="text-xs text-muted hover:text-red-500 transition-colors px-2 py-1"
                title="Sign out"
              >
                Sign out
              </button>

              <Link href="/studio" className="btn-primary text-sm py-2 px-5">
                Open Studio
              </Link>
            </div>
          ) : (
            /* Not logged in */
            <>
              <button
                onClick={() => signIn("google")}
                className="btn-secondary text-sm py-2 px-4 hidden sm:inline-flex"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>

              <Link href="/studio" className="btn-primary text-sm py-2 px-5">
                Open Studio
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 text-charcoal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-surface border-b border-border shadow-lg md:hidden animate-fadeIn">
          <div className="p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-subtext hover:text-charcoal hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {!session && (
              <button
                onClick={() => { signIn("google"); setMobileMenuOpen(false); }}
                className="w-full mt-2 btn-primary text-sm py-2.5 justify-center"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
