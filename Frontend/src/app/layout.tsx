import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BhoomiVerify AI — Intelligent Land Record Digitization & Validation",
  description: "End-to-end AI-powered digitization, validation, and discrepancy detection for Indian land records (PS-26018).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#0f172a] text-[#f1f5f9] antialiased">
        {children}
      </body>
    </html>
  );
}

