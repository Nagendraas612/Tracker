"use client";

import React, { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Edit2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Flame,
  ShieldCheck,
  Building,
  Tag,
  Layers,
} from "lucide-react";

export interface TrackerItem {
  _id: string;
  psId: string;
  title: string;
  organization: string;
  category: string;
  theme: string;
  target: number;
  currentSubmissions: number;
  maximumSubmissions: number;
  status: "monitoring" | "reached" | "error" | "disabled";
  enabled: boolean;
  notificationSent: boolean;
  lastCheckedAt?: string;
  lastNotificationAt?: string;
  deadline?: string;
}

interface TrackerCardProps {
  tracker: TrackerItem;
  onEdit: (tracker: TrackerItem) => void;
  onToggleEnable: (tracker: TrackerItem) => void;
  onDelete: (tracker: TrackerItem) => void;
}

export function TrackerCard({ tracker, onEdit, onToggleEnable, onDelete }: TrackerCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const current = tracker.currentSubmissions || 0;
  const target = tracker.target || 1;
  const max = tracker.maximumSubmissions || 500;

  const remaining = Math.max(target - current, 0);
  const targetPercentage = Math.min(100, Math.round((current / target) * 100));
  const capacityPercentage = Math.min(100, Math.round((current / max) * 100));

  const isReached = current >= target;
  const isAlmostReached = !isReached && current >= target * 0.8;

  // Status badge formatting
  let statusBadge = {
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    dot: "bg-emerald-400",
    text: "Monitoring",
    glow: "progress-glow-green",
  };

  if (!tracker.enabled) {
    statusBadge = {
      bg: "bg-slate-800 border-slate-700 text-slate-400",
      dot: "bg-slate-500",
      text: "Disabled",
      glow: "bg-slate-600",
    };
  } else if (isReached) {
    statusBadge = {
      bg: "bg-red-500/20 border-red-500/40 text-red-400",
      dot: "bg-red-500 animate-ping",
      text: "Target Reached!",
      glow: "progress-glow-red",
    };
  } else if (isAlmostReached) {
    statusBadge = {
      bg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
      dot: "bg-amber-400 animate-pulse",
      text: "Almost Reached",
      glow: "progress-glow-yellow",
    };
  } else if (tracker.status === "error") {
    statusBadge = {
      bg: "bg-orange-500/15 border-orange-500/30 text-orange-400",
      dot: "bg-orange-400",
      text: "Data Unavailable",
      glow: "bg-orange-500",
    };
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(tracker);
    setIsDeleting(false);
    setShowConfirmDelete(false);
  };

  return (
    <div
      className={`glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
        !tracker.enabled ? "opacity-60 grayscale-[30%]" : ""
      }`}
    >
      {/* Background Subtle Gradient Glow when reached */}
      {isReached && tracker.enabled && (
        <div className="absolute -right-20 -top-20 w-44 h-44 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
      )}

      <div>
        {/* Header: PS ID & Category Badges + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-base text-white bg-indigo-600/30 border border-indigo-500/40 px-2.5 py-1 rounded-lg">
              {tracker.psId}
            </span>
            <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {tracker.category || "Software"}
            </span>
          </div>

          {/* Status Badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusBadge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
            {statusBadge.text}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-100 text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-indigo-200 transition-colors" title={tracker.title}>
          {tracker.title}
        </h3>

        {/* Org & Theme */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 flex-wrap">
          <span className="flex items-center gap-1 truncate max-w-[200px]" title={tracker.organization}>
            <Building className="w-3.5 h-3.5 text-slate-500" />
            {tracker.organization}
          </span>
          {tracker.theme && (
            <span className="flex items-center gap-1 truncate max-w-[180px]" title={tracker.theme}>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {tracker.theme}
            </span>
          )}
        </div>

        {/* Submission Counts Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/60 p-3 rounded-xl border border-white/5">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Current Submissions</div>
            <div className="text-lg font-bold text-white flex items-baseline gap-1">
              {current}
              <span className="text-xs font-normal text-slate-500">/ {max}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400">Alert Target</div>
            <div className="text-lg font-bold text-indigo-400 flex items-baseline gap-1">
              {target}
              <span className="text-xs font-normal text-slate-400">({remaining} left)</span>
            </div>
          </div>
        </div>

        {/* Threshold Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-300">Target Threshold Progress</span>
            <span className={isReached ? "text-red-400 font-bold" : isAlmostReached ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {targetPercentage}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusBadge.glow}`}
              style={{ width: `${targetPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Overall SIH Capacity Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>SIH Max Capacity ({max})</span>
            <span>{capacityPercentage}% filled</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-cyan-500/60 rounded-full transition-all duration-500"
              style={{ width: `${capacityPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer Info & Action Buttons */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Checked: {tracker.lastCheckedAt ? new Date(tracker.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Toggle Enable Button */}
          <button
            onClick={() => onToggleEnable(tracker)}
            className={`p-1.5 rounded-lg border transition-colors ${
              tracker.enabled
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
            title={tracker.enabled ? "Pause Monitoring" : "Enable Monitoring"}
          >
            {tracker.enabled ? <Bell className="w-4 h-4 text-indigo-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(tracker)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Edit Target Threshold"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
            title="Remove Tracker"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal Overlay for Removal */}
      {showConfirmDelete && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-4 rounded-2xl flex flex-col justify-center items-center text-center z-20 animate-in fade-in duration-150">
          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
          <h4 className="font-bold text-white text-sm mb-1">Remove Tracker {tracker.psId}?</h4>
          <p className="text-xs text-slate-400 mb-4 max-w-[220px]">
            You will no longer receive threshold alerts for this Problem Statement.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/30 flex items-center gap-1"
            >
              {isDeleting ? "Removing..." : "Yes, Remove"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
