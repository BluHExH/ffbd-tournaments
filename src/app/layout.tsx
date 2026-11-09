import type { Metadata } from "next";
import { Rajdhani, Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FFBD Tournaments | Bangladesh's Biggest Free Fire Tournaments",
  description:
    "Join Bangladesh's biggest Free Fire tournaments. Free & paid cups, instant room ID, bKash/Nagad payouts. Register now and win real prizes.",
  keywords: [
    "Free Fire",
    "Bangladesh",
    "Tournament",
    "FFBD",
    "Esports",
    "bKash",
    "Nagad",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${inter.variable} ${hindSiliguri.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
