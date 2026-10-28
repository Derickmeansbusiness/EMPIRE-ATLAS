import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz", "SOFT"] });

export const metadata: Metadata = {
  title: { default: "Empire Atlas — The Anatomy of Great Fortunes", template: "%s · Empire Atlas" },
  description: "Real estate wealth intelligence, historical deal research and investment simulation. Study the empires. Decode the capital. Engineer the future.",
  applicationName: "Empire Atlas",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#101722", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="grain min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
