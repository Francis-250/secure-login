"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  Loader2,
  MonitorSmartphone,
  ShieldOff,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import {
  actionBtnClass,
  BanForm,
  PasswordForm,
} from "@/components/admin/users-table";
import Drawer from "@/components/admin/drawer";

type AdminUser = {
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

export default function UserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const { data, error } = await authClient.admin.getUser({
      query: { id: userId },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUser(data as unknown as AdminUser);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    authClient.admin
      .getUser({ query: { id: userId } })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        setUser(data as unknown as AdminUser);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadSessions = useCallback(async (userId: string) => {
    setSessionsLoading(true);
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

  const runAction = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handleSetRole = async (role: "user" | "admin") => {
    if (!user) return;
    await runAction(`role:${user.id}`, async () => {
      const { error } = await authClient.admin.setRole({
        userId: user.id,
        role,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Role set to ${role}`);
      fetchUser();
    });
  };

  const handleBan = async (reason: string, expiresIn?: number) => {
    if (!user) return;
    await runAction(`ban:${user.id}`, async () => {
      const { error } = await authClient.admin.banUser({
        userId: user.id,
        banReason: reason || undefined,
        banExpiresIn: expiresIn,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Banned ${user.email}`);
      setBanOpen(false);
      fetchUser();
    });
  };

  const handleUnban = async () => {
    if (!user) return;
    await runAction(`unban:${user.id}`, async () => {
      const { error } = await authClient.admin.unbanUser({ userId: user.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Unbanned ${user.email}`);
      fetchUser();
    });
  };

  const handleDelete = async () => {
    if (!user) return;
    await runAction(`delete:${user.id}`, async () => {
      const { error } = await authClient.admin.removeUser({ userId: user.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Deleted ${user.email}`);
      router.push("/admin/users");
    });
  };

  const handleSetPassword = async (newPassword: string) => {
    if (!user) return;
    await runAction(`password:${user.id}`, async () => {
      const { error } = await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Password updated for ${user.email}`);
      setPasswordOpen(false);
    });
  };

  const handleRevokeSession = async (token: string) => {
    if (!user) return;
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
    if (!user) return;
    await runAction(`revokeAll:${user.id}`, async () => {
      const { error } = await authClient.admin.revokeUserSessions({
        userId: user.id,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`All sessions revoked for ${user.email}`);
      loadSessions(user.id);
    });
  };

  const handleImpersonate = async () => {
    if (!user) return;
    await runAction(`impersonate:${user.id}`, async () => {
      const { error } = await authClient.admin.impersonateUser({
        userId: user.id,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Impersonating ${user.email}`);
      router.push("/");
    });
  };

  if (loading) {
    return (
      <p className="py-16 text-center text-slate-500 dark:text-slate-400">
        Loading user…
      </p>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          User not found or you do not have permission to view them.
        </p>
        <Link href="/admin/users" className="mt-4 inline-block text-blue-700 hover:underline dark:text-blue-500">
          Back to users
        </Link>
      </div>
    );
  }

  const rowBusy =
    busy === `ban:${user.id}` ||
    busy === `unban:${user.id}` ||
    busy === `delete:${user.id}` ||
    busy === `password:${user.id}` ||
    busy === `impersonate:${user.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSessionsOpen(true)}
            disabled={rowBusy}
            className={actionBtnClass}
          >
            <MonitorSmartphone className="size-3.5" />
            Sessions
          </button>
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            disabled={rowBusy}
            className={actionBtnClass}
          >
            Set password
          </button>
          {user.banned ? (
            <button
              type="button"
              onClick={handleUnban}
              disabled={busy === `unban:${user.id}`}
              className={actionBtnClass}
            >
              <ShieldOff className="size-3.5" />
              Unban
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBanOpen(true)}
              disabled={rowBusy}
              className={actionBtnClass}
            >
              <Ban className="size-3.5" />
              Ban
            </button>
          )}
          <button
            type="button"
            onClick={handleImpersonate}
            disabled={busy === `impersonate:${user.id}`}
            className={actionBtnClass}
          >
            <UserRoundCog className="size-3.5" />
            Impersonate
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={rowBusy}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {user.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-neutral-700 dark:text-slate-200">
                {user.role ?? "user"}
              </span>
              {user.emailVerified ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Email verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Email not verified
                </span>
              )}
              {user.twoFactorEnabled ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  2FA enabled
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                  2FA not enabled
                </span>
              )}
              {user.banned ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  Banned
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-neutral-700">
          <div>
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
              User ID
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-slate-900 dark:text-slate-50">
              {user.id}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Role
            </dt>
            <dd className="mt-1">
              <select
                value={user.role ?? "user"}
                onChange={(e) =>
                  handleSetRole(e.target.value as "user" | "admin")
                }
                disabled={busy === `role:${user.id}`}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 outline-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-50">
              {new Date(user.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Updated
            </dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-50">
              {new Date(user.updatedAt).toLocaleString()}
            </dd>
          </div>
          {user.banned && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
                Ban details
              </dt>
              <dd className="mt-1 text-sm text-red-600 dark:text-red-400">
                {user.banReason ?? "No reason"}
                {user.banExpires
                  ? ` · until ${new Date(user.banExpires).toLocaleString()}`
                  : ""}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <Drawer
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        title={`Sessions for ${user.email}`}
      >
        <div className="space-y-3">
          {sessionsLoading ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading sessions…
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No active sessions.
            </p>
          ) : (
            sessions.map((s) => (
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
            ))
          )}
          <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => {
                loadSessions(user.id);
              }}
              className="mr-auto text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={busy === `revokeAll:${user.id}` || sessionsLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              {busy === `revokeAll:${user.id}` ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MonitorSmartphone className="size-3.5" />
              )}
              Revoke all
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={banOpen}
        onClose={() => setBanOpen(false)}
        title={`Ban ${user.email}`}
      >
        <BanForm
          busy={busy === `ban:${user.id}`}
          onSubmit={(reason, expiresIn) => handleBan(reason, expiresIn)}
        />
      </Drawer>

      <Drawer
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title={`Set password for ${user.email}`}
      >
        <PasswordForm
          busy={busy === `password:${user.id}`}
          onSubmit={handleSetPassword}
        />
      </Drawer>

      <Drawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete user"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Permanently delete <span className="font-semibold">{user.email}</span>?
            This removes the account, sessions, and all related data. This
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className={actionBtnClass}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy === `delete:${user.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {busy === `delete:${user.id}` ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete user
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}