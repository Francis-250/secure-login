"use client";

import { MonitorSmartphone, UserRoundCog } from "lucide-react";

export type AdminSession = {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  impersonatedBy: string | null;
  user: { id: string; name: string; email: string; role: string | null } | null;
};

export default function SessionDetailDrawer({
  session,
  onRevoke,
  onRevokeAll,
  busy,
}: {
  session: AdminSession;
  onRevoke?: () => void;
  onRevokeAll?: () => void;
  busy?: string | null;
}) {
  const expired = new Date(session.expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xl font-bold text-white">
          <MonitorSmartphone className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
            {session.user?.name ?? "Unknown user"}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {session.user?.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            expired
              ? "bg-slate-200 text-slate-600 dark:bg-neutral-700 dark:text-slate-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          }`}
        >
          {expired ? "Expired" : "Active"}
        </span>
        {session.user?.role && (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-neutral-700 dark:text-slate-200">
            {session.user.role}
          </span>
        )}
        {session.impersonatedBy && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <UserRoundCog className="size-3" />
            Impersonation session
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2 dark:border-neutral-700">
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Device
          </dt>
          <dd className="mt-1 break-words text-sm text-slate-900 dark:text-slate-50">
            {session.userAgent || "Unknown device"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            IP address
          </dt>
          <dd className="mt-1 break-all font-mono text-sm text-slate-900 dark:text-slate-50">
            {session.ipAddress || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Session ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-slate-50">
            {session.id}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Signed in
          </dt>
          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-50">
            {new Date(session.createdAt).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Expires
          </dt>
          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-50">
            {new Date(session.expiresAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      {(onRevoke || onRevokeAll) && (
        <div className="flex flex-wrap gap-2">
          {onRevokeAll && (
            <button
              type="button"
              onClick={onRevokeAll}
              disabled={busy === `revokeAll:${session.user?.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <MonitorSmartphone className="size-3.5" />
              Revoke all for this user
            </button>
          )}
          {onRevoke && (
            <button
              type="button"
              onClick={onRevoke}
              disabled={busy === `revoke:${session.token}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <MonitorSmartphone className="size-3.5" />
              Revoke this session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
