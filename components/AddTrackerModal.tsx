"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  BellRing,
  Building,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";

interface AddTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PSPreviewData {
  psId: string;
  title: string;
  organization: string;
  category: string;
  theme: string;
  submitted: number;
  maximum: number;
  deadline?: string;
}

export function AddTrackerModal({ isOpen, onClose, onSuccess }: AddTrackerModalProps) {
  const [psIdInput, setPsIdInput] = useState("");
  const [targetInput, setTargetInput] = useState<number | "">(50);
  const [previewData, setPreviewData] = useState<PSPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleFetchPreview = async (inputPsId: string) => {
    const cleanId = inputPsId.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoadingPreview(true);
    setErrorMessage("");
    setPreviewData(null);

    try {
      const res = await fetch("/api/trackers/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ psId: cleanId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPreviewData(data.data);
        // Default target to something reasonable if current submitted > 0
        if (typeof targetInput === "number" && targetInput > data.data.maximum) {
          setTargetInput(data.data.maximum);
        }
      } else {
        setErrorMessage(data.error || "Problem Statement not found.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while looking up Problem Statement.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewData) {
      setErrorMessage("Please validate and look up a Problem Statement ID first.");
      return;
    }

    const targetNum = Number(targetInput);
    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMessage("Alert threshold target must be a positive number.");
      return;
    }

    if (targetNum > previewData.maximum) {
      setErrorMessage(`Target cannot exceed the maximum capacity of ${previewData.maximum}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psId: previewData.psId,
          target: targetNum,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Immediately persist to client storage
        if (typeof window !== "undefined" && data.data) {
          try {
            const raw = window.localStorage.getItem("sih_local_trackers");
            const existing = raw ? JSON.parse(raw) : [];
            const filtered = Array.isArray(existing) ? existing.filter((t: any) => t.psId !== data.data.psId) : [];
            window.localStorage.setItem("sih_local_trackers", JSON.stringify([data.data, ...filtered]));
          } catch (e) {}
        }

        setSuccessMessage(data.message || "Tracker added successfully!");
        setTimeout(() => {
          onSuccess();
          onClose();
          // Reset form state
          setPsIdInput("");
          setPreviewData(null);
          setSuccessMessage("");
        }, 1200);
      } else {
        setErrorMessage(data.error || "Failed to create tracker.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit tracker.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = previewData && typeof targetInput === "number" ? Math.max(targetInput - previewData.submitted, 0) : 0;
  const isTargetAlreadyReached = previewData && typeof targetInput === "number" && previewData.submitted >= targetInput;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-2xl p-6 relative shadow-2xl overflow-hidden border border-indigo-500/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Add Problem Statement Tracker</h2>
              <p className="text-xs text-slate-400">SIH 2026 Real-Time Submission Monitoring</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Step 1: Input PS ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Problem Statement ID <span className="text-indigo-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. SIH26171, SIH26001"
                  value={psIdInput}
                  onChange={(e) => {
                    setPsIdInput(e.target.value.toUpperCase());
                    setErrorMessage("");
                  }}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 outline-none transition-colors"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => handleFetchPreview(psIdInput)}
                disabled={isLoadingPreview || !psIdInput.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                {isLoadingPreview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lookup
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Enter any SIH 2026 Problem Statement ID (e.g. <span className="font-mono text-indigo-300">SIH26171</span>).
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Preview Card */}
          {previewData && (
            <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-sm text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">
                  {previewData.psId}
                </span>
                <span className="text-xs text-cyan-300 font-medium bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {previewData.category}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-slate-100 line-clamp-2">
                  {previewData.title}
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3" /> {previewData.organization}
                  </span>
                  {previewData.theme && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {previewData.theme}
                    </span>
                  )}
                </div>
              </div>

              {/* Current Live Count */}
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-white/5">
                <span className="text-xs text-slate-400 font-medium">Current SIH Submissions:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {previewData.submitted} / {previewData.maximum}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Threshold Target Input */}
          {previewData && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Notify Me When Submissions Reach <span className="text-indigo-400">*</span>
                </label>
                <span className="text-xs font-bold text-indigo-400 font-mono">
                  {targetInput} / {previewData.maximum}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={previewData.maximum}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-28 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-bold text-center outline-none"
                  required
                />

                <input
                  type="range"
                  min="1"
                  max={previewData.maximum}
                  value={typeof targetInput === "number" ? targetInput : 1}
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Real-time status text */}
              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-white/5 text-xs text-slate-300">
                {isTargetAlreadyReached ? (
                  <p className="text-amber-400 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    Target ({targetInput}) is already reached ({previewData.submitted})! Alert will be sent immediately upon adding.
                  </p>
                ) : (
                  <p className="flex items-center justify-between text-slate-300">
                    <span>Submissions remaining to alert:</span>
                    <span className="font-bold text-indigo-300">{remaining} remaining</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !previewData}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  Start Monitoring
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
