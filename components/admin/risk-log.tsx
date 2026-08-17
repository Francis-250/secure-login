"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Filter, Loader2 } from "lucide-react";

type RiskAttempt = {
  id: string;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  riskScore: number | null;
  riskReason: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
};

function scoreColor(score: number | null): string {
  if (score == null) return "bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-slate-200";
  if (score >= 0.7) return "bg-red-600 text-white";
  if (score >= 0.4) return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

export default function RiskLog() {
  const [attempts, setAttempts] = useState<RiskAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [minRisk, setMinRisk] = useState("0");
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    authClient.admin
      .listUsers({ query: { limit: 200, sortBy: "createdAt", sortDirection: "desc" } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return;
        setUsers(
          ((data?.users ?? []) as unknown as {
            id: string;
            email: string;
          }[]).map((u) => ({ id: u.id, email: u.email })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (userId) params.set("userId", userId);
      if (minRisk && minRisk !== "0") params.set("minRisk", minRisk);
      const res = await fetch(`/api/risk?${params.toString()}`);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        toast.error("Failed to load risk log");
        return;
      }
      setAttempts(await res.json());
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [search, userId, minRisk]);

  const highRiskCount = attempts.filter((a) => (a.riskScore ?? 0) >= 0.7).length;
  const failedCount = attempts.filter((a) => !a.success).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Risk log
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Suspicious activity and login attempts, most recent first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Shown in log
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {loading ? "…" : attempts.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Failed attempts
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {loading ? "…" : failedCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            High risk (≥70)
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? "…" : highRiskCount}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Search
          </label>
          <input
            type="search"
            placeholder="Email or risk reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            User
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Minimum risk score
          </label>
          <select
            value={minRisk}
            onChange={(e) => setMinRisk(e.target.value)}
            className="w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
          >
            <option value="0">Any</option>
            <option value="0.4">≥ 40 (medium+)</option>
            <option value="0.7">≥ 70 (high)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Filter className="size-4" />
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <span>Results update as you filter.</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {!loading &&
          attempts.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-slate-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {a.email}
                    </span>
                    {a.user && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {a.user.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {[
                      a.country && `📍 ${a.country}`,
                      a.city && a.city,
                      a.ipAddress && `IP ${a.ipAddress}`,
                      a.userAgent && `· ${a.userAgent}`,
                    ]
                      .filter(Boolean)
                      .join(" ")}{" "}
                    · {new Date(a.createdAt).toLocaleString()}
                  </div>
                  {a.riskReason && (
                    <div className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                      {a.riskReason}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColor(a.riskScore)}`}
                  >
                    {a.riskScore == null
                      ? "No score"
                      : `${Math.round(a.riskScore * 100)} risk`}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.success
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {a.success ? "Success" : "Failed"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        {!loading && attempts.length === 0 && (
          <p className="py-10 text-center text-slate-500 dark:text-slate-400">
            No login attempts match the current filters.
          </p>
        )}
        {loading && (
          <p className="py-10 text-center text-slate-500 dark:text-slate-400">
            Loading…
          </p>
        )}
      </div>
    </div>
  );
}