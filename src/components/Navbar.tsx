"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/tournaments", label: t("nav.tournaments") },
    { href: "/#how", label: t("nav.how") },
    { href: "/#winners", label: t("nav.winners") },
    { href: "/#faq", label: t("nav.faq") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[rgba(11,18,33,0.88)] backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND.logo}
            alt="FFBD Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-md ring-1 ring-white/10"
          />
          <span className="font-heading text-xl font-bold text-white tracking-tight">
            FFBD<span className="text-[#FF5C00]">.</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{lang}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/tournaments"
            className="hidden sm:inline-flex btn btn-primary text-sm px-4 h-10"
          >
            {t("nav.join")}
          </Link>

          <button
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[rgba(11,18,33,0.96)] backdrop-blur-xl border-t border-white/10">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-base font-medium text-white/80 hover:text-white rounded-lg hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/tournaments"
              onClick={() => setOpen(false)}
              className="mt-2 btn btn-primary w-full"
            >
              {t("nav.join")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
