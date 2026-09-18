"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrackerCard, TrackerItem } from "@/components/TrackerCard";
import { AddTrackerModal } from "@/components/AddTrackerModal";
import { EditTrackerModal } from "@/components/EditTrackerModal";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  Smartphone,
  Info,
} from "lucide-react";

interface TrackerStats {
  totalTrackers: number;
  activeMonitoring: number;
  targetsReached: number;
  notificationsSent: number;
}

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<TrackerItem[]>([]);
  const [stats, setStats] = useState<TrackerStats>({
    totalTrackers: 0,
    activeMonitoring: 0,
    targetsReached: 0,
    notificationsSent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "monitoring" | "reached" | "disabled">("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<TrackerItem | null>(null);
  const [userNtfyTopic, setUserNtfyTopic] = useState<string>("");

  // Fetch trackers and stats with persistent client-side caching & auto-sync
  const fetchTrackers = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      // 1. First, check if client localStorage has cached trackers to avoid empty screen flicker
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem("sih_local_trackers");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTrackers((prev) => (prev.length === 0 ? parsed : prev));
            }
          } catch (e) {
            // Ignore parse error
          }
        }
      }

      const res = await fetch("/api/trackers");
      const data = await res.json();

      if (res.ok && data.success) {
        const serverTrackers = data.data || [];
        
        // If server returned trackers, use them and persist to localStorage
        if (serverTrackers.length > 0) {
          setTrackers(serverTrackers);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("sih_local_trackers", JSON.stringify(serverTrackers));
          }
        } else {
          // If server returned 0 (e.g. Vercel serverless instance rebooted /tmp),
          // recover from client localStorage and re-sync to serverless backend
          if (typeof window !== "undefined") {
            const cached = window.localStorage.getItem("sih_local_trackers");
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setTrackers(parsed);
                  // Re-sync to server in background
                  for (const t of parsed) {
                    fetch("/api/trackers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ psId: t.psId, target: t.target }),
                    }).catch(() => {});
                  }
                }
              } catch (e) {}
            }
          }
        }

        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching trackers:", err);
      // On network error, hydrate from localStorage
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem("sih_local_trackers");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) setTrackers(parsed);
          } catch (e) {}
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch user ntfy topic settings
  const fetchNotificationSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.success && data.data?.topic) {
        setUserNtfyTopic(data.data.topic);
      }
    } catch (err) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchTrackers();
    fetchNotificationSettings();

    // Auto refresh every 15 seconds
    const interval = setInterval(() => {
      fetchTrackers();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTrackers, fetchNotificationSettings]);

  // Handle Enable/Disable Toggle
  const handleToggleEnable = async (tracker: TrackerItem) => {
    const updatedStatus = !tracker.enabled;
    // Optimistic UI & localStorage update
    const updatedList = trackers.map((t) =>
      t._id === tracker._id ? { ...t, enabled: updatedStatus, status: updatedStatus ? "monitoring" as const : "disabled" as const } : t
    );
    setTrackers(updatedList);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sih_local_trackers", JSON.stringify(updatedList));
    }

    try {
      const res = await fetch(`/api/trackers/${tracker._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: updatedStatus }),
      });
      if (res.ok) fetchTrackers();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // Handle Delete Tracker
  const handleDeleteTracker = async (trackerOrId: TrackerItem | string) => {
    const trackerId = typeof trackerOrId === "string" ? trackerOrId : trackerOrId._id;
    if (!confirm("Are you sure you want to stop tracking and delete this Problem Statement?")) {
      return;
    }

    // Optimistic UI & localStorage removal
    const updatedList = trackers.filter((t) => t._id !== trackerId);
    setTrackers(updatedList);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sih_local_trackers", JSON.stringify(updatedList));
    }

    try {
      const res = await fetch(`/api/trackers/${trackerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTrackers();
      }
    } catch (err) {
      console.error("Delete tracker error:", err);
    }
  };

  // Filter trackers
  const filteredTrackers = trackers.filter((t) => {
    const matchesSearch =
      t.psId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.organization.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "monitoring") return t.enabled && t.status === "monitoring";
    if (statusFilter === "reached") return t.status === "reached";
    if (statusFilter === "disabled") return !t.enabled;

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              SIH Problem Statement Dashboard
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                Live Monitoring
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your tracked Problem Statements and custom submission count alert thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTrackers(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
              title="Refresh live counts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Counts"}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Add Problem Statement
            </button>
          </div>
        </div>

        {/* Ntfy Config Warning Banner (If topic not set) */}
        {!userNtfyTopic && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-200">Phone Notification Setup Required:</span>{" "}
                Configure your ntfy topic to receive push notifications when thresholds are reached.
              </div>
            </div>
            <Link
              href="/settings"
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold shrink-0"
            >
              Configure ntfy Now
            </Link>
          </div>
        )}

        {/* KPI Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Total Trackers</div>
              <div className="text-2xl font-extrabold text-white mt-1">{stats.totalTrackers}</div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 font-medium">Currently Monitoring</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.activeMonitoring}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 font-medium">Targets Reached</div>
              <div className="text-2xl font-extrabold text-red-400 mt-1">{stats.targetsReached}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 font-medium">Alerts Sent</div>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1">{stats.notificationsSent}</div>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PS ID, Title, Org..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({trackers.length})
            </button>
            <button
              onClick={() => setStatusFilter("monitoring")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === "monitoring" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              🟢 Monitoring ({stats.activeMonitoring})
            </button>
            <button
              onClick={() => setStatusFilter("reached")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === "reached" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              🔴 Reached ({stats.targetsReached})
            </button>
            <button
              onClick={() => setStatusFilter("disabled")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === "disabled" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚪ Disabled
            </button>
          </div>
        </div>

        {/* Trackers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl h-64 animate-pulse space-y-4">
                <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-12 bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredTrackers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrackers.map((tracker) => (
              <TrackerCard
                key={tracker._id}
                tracker={tracker}
                onEdit={(t) => setEditingTracker(t)}
                onToggleEnable={handleToggleEnable}
                onDelete={handleDeleteTracker}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-card rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>

            <h3 className="font-bold text-lg text-white">No Problem Statements Tracked Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You aren't tracking any SIH 2026 Problem Statements yet. Track PSs such as <span className="font-mono text-indigo-300">SIH26171</span> or <span className="font-mono text-indigo-300">SIH26001</span> to get notified on your phone.
            </p>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Problem Statement
            </button>
          </div>
        )}
      </main>

      {/* Add Tracker Modal */}
      <AddTrackerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchTrackers()}
      />

      {/* Edit Tracker Modal */}
      <EditTrackerModal
        tracker={editingTracker}
        isOpen={!!editingTracker}
        onClose={() => setEditingTracker(null)}
        onSuccess={() => fetchTrackers()}
      />

      <Footer />
    </div>
  );
}
