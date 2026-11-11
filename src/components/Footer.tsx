"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { BRAND } from "@/lib/brand";
import {
  FacebookIcon,
  TelegramIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

export default function Footer() {
  const { t } = useLanguage();

  const socials = [
    {
      icon: FacebookIcon,
      href: BRAND.social.facebook,
      label: "Facebook",
      color: "hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10",
    },
    {
      icon: TelegramIcon,
      href: BRAND.social.telegram,
      label: "Telegram",
      color: "hover:text-[#26A5E4] hover:border-[#26A5E4]/50 hover:bg-[#26A5E4]/10",
    },
    {
      icon: WhatsAppIcon,
      href: BRAND.social.telegram,
      label: "WhatsApp",
      color: "hover:text-[#25D366] hover:border-[#25D366]/50 hover:bg-[#25D366]/10",
    },
    {
      icon: YouTubeIcon,
      href: BRAND.social.facebook,
      label: "YouTube",
      color: "hover:text-[#FF0000] hover:border-[#FF0000]/50 hover:bg-[#FF0000]/10",
    },
  ];

  return (
    <footer className="bg-[#0B1221] text-white/80 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND.logo}
                alt={BRAND.name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
              />
              <span className="font-heading text-lg font-bold text-white leading-tight">
                BANGLAR
                <span className="block text-[#FF5C00] text-sm tracking-wide">
                  TOURNAMENTS
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/60 max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              {t("footer.quick")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/tournaments"
                  className="hover:text-[#FF5C00] transition-colors"
                >
                  {t("nav.tournaments")}
                </Link>
              </li>
              <li>
                <a href="/#how" className="hover:text-[#FF5C00] transition-colors">
                  {t("nav.how")}
                </a>
              </li>
              <li>
                <a href="/#winners" className="hover:text-[#FF5C00] transition-colors">
                  {t("nav.winners")}
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-[#FF5C00] transition-colors">
                  {t("nav.faq")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              {t("footer.support")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={BRAND.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF5C00] transition-colors"
                >
                  Telegram Support
                </a>
              </li>
              <li>
                <a
                  href={BRAND.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF5C00] transition-colors"
                >
                  Facebook Page
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              {t("footer.social")}
            </h4>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 transition-all ${s.color}`}
                >
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. {t("footer.rights")}
          </p>
          <p>Made for Bangladeshi Free Fire community</p>
        </div>
      </div>
    </footer>
  );
}
