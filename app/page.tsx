import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BellRing,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight,
  Smartphone,
  BarChart3,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-inner">
              <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              SIH 2026 Problem Statement Tracker
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Track SIH Submission Limits.{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Get Instant Phone Alerts.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
              Monitor multiple Smart India Hackathon Problem Statements in real time. Set custom alert thresholds and receive instant push notifications on your phone via ntfy when submission limits approach.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.03]"
              >
                Open Dashboard Now
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/settings"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm border border-slate-800 flex items-center justify-center gap-2 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Configure ntfy Phone App
              </Link>
            </div>
          </div>

          {/* Feature Teaser Card Mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-6 sm:p-8 relative border border-indigo-500/30 shadow-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <BellRing className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-lg">SIH26171</span>
                      <span className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">Software</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">On-device Visual Perception for Light-weight Browser Agents</p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  🟢 Monitoring Active
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Live Submissions</span>
                  <div className="text-2xl font-bold text-white mt-1">26 <span className="text-xs text-slate-500">/ 500</span></div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Target Threshold</span>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">50 <span className="text-xs text-slate-400">(24 left)</span></div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400 font-medium">ntfy Push Alert</span>
                  <div className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Configured & Armed
                  </div>
                </div>
              </div>

              {/* Progress bar preview */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Progress to Alert Target</span>
                  <span className="text-emerald-400 font-bold">52%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div className="h-full rounded-full progress-glow-green" style={{ width: "52%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-slate-950/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why SIH Candidates Use SIH Tracker</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Stop manually refreshing the SIH website. Get continuous monitoring and automated phone push alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Continuous Monitoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Background monitoring worker polls SIH 2026 data continuously independent of whether your browser is open.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">ntfy Phone Alerts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant push notifications to your Android or iOS device via ntfy.sh topic subscriptions.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Zero Duplicate Spam</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                MongoDB notification state tracking ensures you receive alert push notifications exactly once per target reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How It Works in 3 Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                1
              </div>
              <h3 className="font-bold text-white text-sm">Enter Problem Statement ID</h3>
              <p className="text-xs text-slate-400">
                Type any SIH 2026 PS ID (e.g. <span className="font-mono text-indigo-300">SIH26171</span>) to fetch live data.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                2
              </div>
              <h3 className="font-bold text-white text-sm">Set Alert Threshold</h3>
              <p className="text-xs text-slate-400">
                Choose your submission count target (e.g. notify when submissions reach 50 or 100).
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                3
              </div>
              <h3 className="font-bold text-white text-sm">Receive Phone Notification</h3>
              <p className="text-xs text-slate-400">
                When SIH submission count reaches your target, your phone buzzes immediately via ntfy!
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
