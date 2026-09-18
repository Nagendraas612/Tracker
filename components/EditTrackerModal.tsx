"use client";

import React, { useState, useEffect } from "react";
import { X, Edit2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { TrackerItem } from "./TrackerCard";

interface EditTrackerModalProps {
  tracker: TrackerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTrackerModal({ tracker, isOpen, onClose, onSuccess }: EditTrackerModalProps) {
  const [targetInput, setTargetInput] = useState<number | "">(50);
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (tracker) {
      setTargetInput(tracker.target);
      setEnabled(tracker.enabled);
      setErrorMessage("");
    }
  }, [tracker]);

  if (!isOpen || !tracker) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetNum = Number(targetInput);
    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMessage("Target must be a positive integer.");
      return;
    }

    if (targetNum > tracker.maximumSubmissions) {
      setErrorMessage(`Target cannot exceed maximum limit of ${tracker.maximumSubmissions}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/trackers/${tracker._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetNum,
          enabled,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || "Failed to update tracker.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update tracker.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const current = tracker.currentSubmissions;
  const remaining = typeof targetInput === "number" ? Math.max(targetInput - current, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-indigo-500/20">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Edit Tracker {tracker.psId}</h2>
              <p className="text-xs text-slate-400">Update submission alert threshold</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
            <div className="text-xs text-slate-400">Problem Statement Title:</div>
            <div className="text-xs font-semibold text-white line-clamp-2">{tracker.title}</div>
            <div className="text-xs text-emerald-400 font-medium pt-1">
              Current Live Submissions: <span className="font-bold">{current} / {tracker.maximumSubmissions}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              New Alert Threshold Target
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={tracker.maximumSubmissions}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-28 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-bold text-center outline-none"
                required
              />
              <input
                type="range"
                min="1"
                max={tracker.maximumSubmissions}
                value={typeof targetInput === "number" ? targetInput : 1}
                onChange={(e) => setTargetInput(Number(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {remaining > 0 ? `${remaining} submissions remaining to reach target.` : "Target is at or below current submission count."}
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <span className="text-xs font-medium text-slate-300">Monitoring Active</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
