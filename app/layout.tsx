import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "SIH Tracker 2026 | Real-time Problem Statement Submission Tracker",
  description:
    "Monitor live Smart India Hackathon 2026 Problem Statement submission counts, set custom alert thresholds, and receive instant phone notifications via ntfy.",
  keywords: ["SIH 2026", "Smart India Hackathon", "Problem Statement Tracker", "ntfy notifications", "submission count"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-[#090d16] text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
