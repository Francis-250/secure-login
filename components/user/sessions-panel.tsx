"use client";

import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
} from "lucide-react";

type SessionInfo = {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

function parseDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  const os = /Windows NT/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const device = /iPhone|iPad|Android/.test(ua) ? "mobile" : "desktop";
  return `${browser} on ${os} · ${device}`;
}

function DeviceIcon({ userAgent }: { userAgent?: string | null }) {
  const ua = userAgent ?? "";
  if (/iPad|Tablet/.test(ua)) return <Tablet className="size-5" />;
  if (/Mobi|iPhone|Android/.test(ua)) return <Smartphone className="size-5" />;
  return <MonitorSmartphone className="size-5" />;
}

export default function SessionsPanel() {
  const { data: session } = authClient.useSession();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await authClient.listSessions();
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSessions((data as SessionInfo[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authClient.listSessions().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        return;
      }
      setSessions((data as SessionInfo[]) ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRevoke = async (token: string) => {
    setBusy(token);
    const { error } = await authClient.revokeSession({ token });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session revoked");
    load();
  };

  const handleRevokeOthers = async () => {
    setBusy("others");
    const { error } = await authClient.revokeOtherSessions();
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out everywhere else");
    load();
  };

  const currentToken = session?.session?.token;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Sessions
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Every device currently signed in to your account.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleRevokeOthers}
            disabled={busy === "others" || sessions.length <= 1}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {busy === "others" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Sign out everywhere else
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading sessions…
          </p>
        ) : sessions.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No active sessions.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-neutral-700">
            {sessions.map((s) => {
              const current = s.token === currentToken;
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                    <DeviceIcon userAgent={s.userAgent} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                        {parseDevice(s.userAgent)}
                      </span>
                      {current && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {s.ipAddress ? `IP ${s.ipAddress} · ` : ""}
                      Last active {s.updatedAt.toLocaleString()} · Signed in{" "}
                      {s.createdAt.toLocaleString()}
                    </p>
                  </div>
                  {!current && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(s.token)}
                      disabled={busy === s.token}
                      className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
                    >
                      {busy === s.token ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}