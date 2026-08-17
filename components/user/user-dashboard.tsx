"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import TwoFactorManager from "@/components/auth/two-factor-manager";

type UserSession = {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  expiresAt: Date;
};

export default function UserDashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const loadSessions = useCallback(async () => {
    const { data, error } = await authClient.listSessions();
    if (error) {
      toast.error(error.message);
      return;
    }
    setSessions((data as unknown as UserSession[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authClient.listSessions().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        return;
      }
      setSessions((data as unknown as UserSession[]) ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRevoke = async (sessionId: string) => {
    const { error } = await authClient.revokeSession({ token: sessionId });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session revoked");
    loadSessions();
  };

  const handleRevokeAll = async () => {
    for (const s of sessions) {
      await authClient.revokeSession({ token: s.token });
    }
    toast.success("All other sessions revoked");
    loadSessions();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Your account
        </h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
        >
          Sign out
        </button>
      </div>

      {user && (
        <div className="mb-8 rounded-lg border border-slate-300 p-6 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "Avatar"}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {user.name}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {user.email}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.emailVerified
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {user.emailVerified ? "Email verified" : "Email not verified"}
                </span>
                {user.twoFactorEnabled && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    2FA enabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <TwoFactorManager />
      </div>

      <div className="rounded-lg border border-slate-300 dark:border-neutral-700">
        <div className="flex items-center justify-between border-b border-slate-300 px-6 py-4 dark:border-neutral-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">
            Active sessions
          </h2>
          <button
            type="button"
            onClick={handleRevokeAll}
            className="text-sm text-blue-700 hover:underline dark:text-blue-500"
          >
            Revoke all other sessions
          </button>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-neutral-700">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {s.userAgent || "Unknown device"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {s.ipAddress ? `IP ${s.ipAddress} · ` : ""}
                  Signed in {new Date(s.createdAt).toLocaleString()} · Expires{" "}
                  {new Date(s.expiresAt).toLocaleString()}
                </div>
              </div>
              {s.id !== session?.session.id && (
                <button
                  type="button"
                  onClick={() => handleRevoke(s.token)}
                  className="shrink-0 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
          {sessions.length === 0 && (
            <li className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No active sessions.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}