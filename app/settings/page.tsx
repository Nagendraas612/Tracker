"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BellRing,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ExternalLink,
  ShieldCheck,
  Activity,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [topicInput, setTopicInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [copied, setCopied] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Fetch current notification settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (res.ok && data.success && data.data?.topic) {
          setTopicInput(data.data.topic);
        }

        const sysRes = await fetch("/api/system");
        const sysData = await sysRes.json();
        if (sysRes.ok && sysData.success) {
          setSystemStatus(sysData.system);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save topic setting
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveStatus({ type: "success", message: "ntfy topic saved successfully!" });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Failed to update ntfy topic." });
      }
    } catch (err: any) {
      setSaveStatus({ type: "error", message: err.message || "Failed to save topic." });
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger test notification
  const handleSendTestNotification = async () => {
    if (!topicInput.trim()) return;

    setIsSendingTest(true);
    setTestStatus(null);

    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestStatus({
          type: "success",
          message: data.message || `Test notification sent! Check your ntfy topic "${topicInput.trim()}".`,
        });
      } else {
        setTestStatus({
          type: "error",
          message: data.error || "Failed to deliver test notification.",
        });
      }
    } catch (err: any) {
      setTestStatus({ type: "error", message: err.message || "Network error while sending test alert." });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCopyTopic = () => {
    if (topicInput) {
      navigator.clipboard.writeText(topicInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerManualCycle = async () => {
    try {
      const res = await fetch("/api/system", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSystemStatus((prev: any) => ({
          ...prev,
          lastCycleSummary: data.summary,
        }));
      }
    } catch (err) {
      console.error("Manual cycle trigger error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-indigo-400" />
            Notification & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your ntfy phone notification topic and test your alert delivery setup.
          </p>
        </div>

        {/* Setup Instructions Card */}
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 space-y-4">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-400" />
            How to Setup Phone Notifications via ntfy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <div className="font-bold text-indigo-400">Step 1</div>
              <div className="font-semibold text-white">Install ntfy App</div>
              <div className="text-slate-400 text-[11px]">Download ntfy on Android (Play Store) or iOS.</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <div className="font-bold text-indigo-400">Step 2</div>
              <div className="font-semibold text-white">Subscribe Topic</div>
              <div className="text-slate-400 text-[11px]">Tap (+) in app and subscribe to your topic name.</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <div className="font-bold text-indigo-400">Step 3</div>
              <div className="font-semibold text-white">Enable Alerts</div>
              <div className="text-slate-400 text-[11px]">Allow push notifications in system settings.</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <div className="font-bold text-indigo-400">Step 4</div>
              <div className="font-semibold text-white">Send Test Alert</div>
              <div className="text-slate-400 text-[11px]">Click button below to test immediate delivery!</div>
            </div>
          </div>
        </div>

        {/* Topic Configuration Form */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
          <h2 className="font-bold text-base text-white">ntfy Subscription Topic Configuration</h2>

          <form onSubmit={handleSaveTopic} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ntfy Topic Name <span className="text-indigo-400">*</span>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. sanjay-sih-alert-7x92k4"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCopyTopic}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                    title="Copy topic name"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !topicInput.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Topic"}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                Your ntfy URL is: <span className="font-mono text-cyan-300">https://ntfy.sh/{topicInput || "your-topic"}</span>
              </p>
            </div>

            {saveStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  saveStatus.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {saveStatus.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{saveStatus.message}</span>
              </div>
            )}
          </form>

          {/* Test Notification Section */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">Test Notification Delivery</h3>
                <p className="text-xs text-slate-400">Send an immediate test alert to your phone via ntfy.</p>
              </div>

              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={isSendingTest || !topicInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Test Notification
                  </>
                )}
              </button>
            </div>

            {testStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testStatus.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {testStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* System Monitoring Worker Status */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-base text-white">Continuous Background Monitoring Status</h2>
            </div>

            <button
              onClick={handleTriggerManualCycle}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Run Monitoring Cycle Now
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
              <span className="text-slate-400">Worker Status</span>
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Operational
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
              <span className="text-slate-400">Polling Interval</span>
              <div className="font-bold text-white mt-1">
                {systemStatus?.pollIntervalMs ? `${systemStatus.pollIntervalMs / 1000} seconds` : "30 seconds"}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
              <span className="text-slate-400">SIH Source URL</span>
              <div className="font-mono text-cyan-300 truncate mt-1">sih.gov.in/sih2026PS</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
