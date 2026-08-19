"use client";

import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  MailCheck,
  MailX,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import { actionBtnClass } from "@/components/admin/users-table";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  banned: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  twoFactorEnabled?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserSession = {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export default function UserDetailDrawer({
  user,
  onUserChanged,
}: {
  user: AdminUser;
  onUserChanged?: (user: AdminUser) => void;
}) {
  const [detail, setDetail] = useState<AdminUser | null>(user);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const { data: session } = authClient.useSession();
  const canManageRoles = session?.user?.role === "admin";

  useEffect(() => {
    let cancelled = false;
    authClient.admin
      .getUser({ query: { id: user.id } })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        const fresh = data as unknown as AdminUser;
        setDetail(fresh);
        onUserChanged?.(fresh);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, onUserChanged]);

  const loadSessions = useCallback(async (userId: string) => {
    const { data, error } = await authClient.admin.listUserSessions({
      userId,
    });
    setSessionsLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSessions((data?.sessions as unknown as UserSession[]) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions(user.id);
  }, [user.id, loadSessions]);

  const runAction = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handleRevokeSession = async (token: string) => {
    await runAction(`revoke:${token}`, async () => {
      const { error } = await authClient.admin.revokeUserSession({
        sessionToken: token,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Session revoked");
      loadSessions(user.id);
    });
  };

  const handleRevokeAll = async () => {
    await runAction(`revokeAll:${user.id}`, async () => {
      const { error } = await authClient.admin.revokeUserSessions({
        userId: user.id,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("All sessions revoked");
      loadSessions(user.id);
    });
  };

  const handleSetRole = async (role: "user" | "admin") => {
    if (!detail) return;
    await runAction(`role:${detail.id}`, async () => {
      const { error } = await authClient.admin.setRole({
        userId: detail.id,
        role,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Role set to ${role}`);
      setDetail({ ...detail, role });
      onUserChanged?.({ ...detail, role });
    });
  };

  const handleToggleEmailVerified = async (verified: boolean) => {
    if (!detail) return;
    await runAction(`verify:${detail.id}`, async () => {
      const { error } = await authClient.admin.updateUser({
        userId: detail.id,
        data: { emailVerified: verified },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        verified
          ? `Email verified for ${detail.email}`
          : `Email marked unverified for ${detail.email}`,
      );
      const updated = { ...detail, emailVerified: verified };
      setDetail(updated);
      onUserChanged?.(updated);
    });
  };

  if (!detail) {
    return <p className="text-sm text-slate-500">Loading user…</p>;
  }

  return (
    <div className="space-y-6">
      {loading && (
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="size-4 animate-spin" />
          Refreshing details…
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
          {(detail.name ?? detail.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
            {detail.name}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {detail.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-neutral-700 dark:text-slate-200">
          {detail.role ?? "user"}
        </span>
        {detail.emailVerified ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Email verified
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Email not verified
          </span>
        )}
        {detail.twoFactorEnabled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <ShieldCheck className="size-3" />
            2FA enabled
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
            2FA not enabled
          </span>
        )}
        {detail.banned ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Banned
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Active
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2 dark:border-neutral-700">
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Role
          </dt>
          <dd className="mt-1">
            {canManageRoles ? (
              <select
                value={detail.role ?? "user"}
                onChange={(e) =>
                  handleSetRole(e.target.value as "user" | "admin")
                }
                disabled={busy === `role:${detail.id}`}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 outline-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
              >
                <option value="user">user</option>
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </select>
            ) : (
              <span className="text-sm text-slate-900 dark:text-slate-50">
                {detail.role ?? "user"}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Email verification
          </dt>
          <dd className="mt-1">
            <button
              type="button"
              onClick={() => handleToggleEmailVerified(!detail.emailVerified)}
              disabled={busy === `verify:${detail.id}`}
              className={actionBtnClass}
            >
              {detail.emailVerified ? (
                <>
                  <MailX className="size-3.5" />
                  Mark unverified
                </>
              ) : (
                <>
                  <MailCheck className="size-3.5" />
                  Mark verified
                </>
              )}
            </button>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            User ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-slate-50">
            {detail.id}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Created
          </dt>
          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-50">
            {new Date(detail.createdAt).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Updated
          </dt>
          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-50">
            {new Date(detail.updatedAt).toLocaleString()}
          </dd>
        </div>
        {detail.banned && (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Ban details
            </dt>
            <dd className="mt-1 text-sm text-red-600 dark:text-red-400">
              {detail.banReason ?? "No reason"}
              {detail.banExpires
                ? ` · until ${new Date(detail.banExpires).toLocaleString()}`
                : ""}
            </dd>
          </div>
        )}
      </dl>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <MonitorSmartphone className="size-4" />
            Active sessions
          </h3>
          <button
            type="button"
            onClick={() => handleRevokeAll()}
            disabled={busy === `revokeAll:${detail.id}` || sessionsLoading}
            className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {busy === `revokeAll:${detail.id}`
              ? "Revoking…"
              : "Revoke all sessions"}
          </button>
        </div>

        {sessionsLoading ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading sessions…
          </p>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No active sessions.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-slate-200 p-3 dark:border-neutral-700"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {s.userAgent || "Unknown device"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {s.ipAddress ? `IP ${s.ipAddress} · ` : ""}
                  Expires {new Date(s.expiresAt).toLocaleString()}
                </p>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.token)}
                    disabled={busy === `revoke:${s.token}`}
                    className={actionBtnClass}
                  >
                    {busy === `revoke:${s.token}` ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MonitorSmartphone className="size-3.5" />
                    )}
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
