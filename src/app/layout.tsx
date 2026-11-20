import type { Metadata } from "next";
import { Hind_Siliguri, Inter, Rajdhani } from "next/font/google";

const hindSiliguri = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BRAND } from "@/lib/brand";
import { UserPresence } from "@/components/UserPresence";

export const metadata: Metadata = {
  title: `${BRAND.name} | Bangladesh Free Fire Tournaments`,
  description:
    "BANGLAR TOURNAMENTS — Bangladesh's Free Fire cups. Free & paid entry, room ID, bKash/Nagad payouts. Play fair, win big.",
  keywords: [
    "Free Fire",
    "Bangladesh",
    "Tournament",
    "BANGLAR TOURNAMENTS",
    "Esports",
    "bKash",
    "Nagad",
  ],
  icons: {
    icon: [{ url: BRAND.logo, type: "image/jpeg" }],
    apple: [{ url: BRAND.logo }],
    shortcut: BRAND.logo,
  },
  openGraph: {
    title: BRAND.name,
    description: "Bangladesh Free Fire Tournaments — free & paid cups",
    images: [{ url: BRAND.cover }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${hindSiliguri.variable} ${inter.variable} ${rajdhani.variable}`}>
      <head>
        <link rel="icon" href={BRAND.logo} type="image/jpeg" />
        <link rel="apple-touch-icon" href={BRAND.logo} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <LanguageProvider><UserPresence />{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
