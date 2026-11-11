import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BRAND } from "@/lib/brand";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Rajdhani:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href={BRAND.logo} type="image/jpeg" />
        <link rel="apple-touch-icon" href={BRAND.logo} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
