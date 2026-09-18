import React from "react";
import Link from "next/link";
import { Activity, Bell, ExternalLink, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/90 py-8 mt-auto text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-slate-300 font-medium">SIH Tracker 2026</span>
          <span className="text-slate-600">|</span>
          <span>Automated Problem Statement Submission Monitoring</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://sih.gov.in/sih2026PS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
          >
            Official SIH Page <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://ntfy.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
          >
            ntfy.sh App <ExternalLink className="w-3 h-3" />
          </a>
          <Link href="/settings" className="hover:text-indigo-400 transition-colors">
            Setup Alerts
          </Link>
        </div>
      </div>
    </footer>
  );
}
