"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BrainCircuit,
  Cpu,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { AppSettings } from "@/lib/settings";

interface SettingsManagerProps {
  initialSettings: AppSettings;
  initialAiRequestCount: number;
  aiModel: string;
}

export default function SettingsManager({
  initialSettings,
  initialAiRequestCount,
  aiModel,
}: SettingsManagerProps) {
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(
    String(initialSettings.maxFailedAttempts),
  );
  const [aiRiskEnabled, setAiRiskEnabled] = useState(
    initialSettings.aiRiskEnabled,
  );
  const [aiRequestCount, setAiRequestCount] = useState(initialAiRequestCount);
  const [busyPolicy, setBusyPolicy] = useState(false);
  const [busyAi, setBusyAi] = useState(false);

  const savePolicy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = Number(maxFailedAttempts);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      toast.error("Enter a whole number between 1 and 100");
      return;
    }
    setBusyPolicy(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxFailedAttempts: n }),
    });
    const data = (await res.json().catch(() => null)) as {
      settings?: AppSettings;
      error?: string;
    } | null;
    setBusyPolicy(false);
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to save login policy");
      return;
    }
    setMaxFailedAttempts(String(data?.settings?.maxFailedAttempts ?? n));
    toast.success("Login policy updated");
  };

  const toggleAi = async (enabled: boolean) => {
    setBusyAi(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiRiskEnabled: enabled }),
    });
    const data = (await res.json().catch(() => null)) as {
      settings?: AppSettings;
      aiRequestCount?: number;
      error?: string;
    } | null;
    setBusyAi(false);
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to update AI assessment");
      return;
    }
    setAiRiskEnabled(enabled);
    if (data?.aiRequestCount !== undefined) {
      setAiRequestCount(data.aiRequestCount);
    }
    toast.success(
      enabled
        ? "AI risk assessment enabled"
        : "AI risk assessment disabled — heuristics only",
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Login policy
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              How many failed sign-in attempts a user may make before the
              account is locked.
            </p>
          </div>
        </div>

        <form onSubmit={savePolicy} className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-48">
            <label
              htmlFor="maxFailedAttempts"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Allowed failed attempts
            </label>
            <input
              id="maxFailedAttempts"
              type="number"
              min={1}
              max={100}
              value={maxFailedAttempts}
              onChange={(e) => setMaxFailedAttempts(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50"
            />
          </div>
          <button
            type="submit"
            disabled={busyPolicy}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {busyPolicy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save policy
          </button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-300">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p>
            When a user exceeds this limit, their next sign-in is blocked for
            24 hours. This threshold is also used by the risk heuristics to
            flag high attempt velocity.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
            <BrainCircuit className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              AI risk assessment
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Let an LLM refine sign-in risk scores on top of the built-in
              heuristics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Cpu className="size-3.5" />
              Model
            </p>
            <p className="mt-1 truncate font-mono text-sm font-medium text-slate-900 dark:text-slate-50">
              {aiModel}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <BrainCircuit className="size-3.5" />
              AI requests
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
              {aiRequestCount}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Status
            </p>
            <div className="mt-1 flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  aiRiskEnabled
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {aiRiskEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={aiRiskEnabled}
                aria-label="Toggle AI risk assessment"
                onClick={() => toggleAi(!aiRiskEnabled)}
                disabled={busyAi}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  aiRiskEnabled
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-neutral-700"
                } ${busyAi ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                    aiRiskEnabled ? "translate-x-[26px]" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-300">
          <BrainCircuit className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <p>
            Each sign-in that is not already flagged as high risk is sent to{" "}
            <span className="font-mono text-xs">{aiModel}</span> for a refined
            score. Requests are counted from the moment this setting is saved.
            Disabling it uses fast, free heuristics only.
          </p>
        </div>
      </div>
    </div>
  );
}