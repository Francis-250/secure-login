"use client";

import { authClient } from "@/lib/auth-client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, MonitorSmartphone } from "lucide-react";
import ActionDropdown from "@/components/admin/dropdown-menu";
import Drawer from "@/components/admin/drawer";
import SessionDetailDrawer, {
  type AdminSession,
} from "@/components/admin/session-detail-drawer";
import { iconBtnClass } from "@/components/admin/users-table";

export default function SessionsTable({
  initialSessions,
}: {
  initialSessions: AdminSession[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewSession, setViewSession] = useState<AdminSession | null>(null);
  const [lastViewSession, setLastViewSession] = useState<AdminSession | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        (s.user?.email.toLowerCase().includes(q) ?? false) ||
        (s.user?.name.toLowerCase().includes(q) ?? false) ||
        (s.userAgent?.toLowerCase().includes(q) ?? false) ||
        (s.ipAddress?.toLowerCase().includes(q) ?? false),
    );
  }, [sessions, search]);

  const runAction = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handleRevoke = async (s: AdminSession) => {
    await runAction(`revoke:${s.token}`, async () => {
      const { error } = await authClient.admin.revokeUserSession({
        sessionToken: s.token,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
      if (viewSession?.id === s.id) setViewSession(null);
    });
  };

  const handleRevokeAllForUser = async (userId: string) => {
    await runAction(`revokeAll:${userId}`, async () => {
      const { error } = await authClient.admin.revokeUserSessions({ userId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("All sessions for this user revoked");
      setSessions((prev) => prev.filter((x) => x.user?.id !== userId));
      if (viewSession?.user?.id === userId) setViewSession(null);
    });
  };

  const openViewer = (s: AdminSession) => {
    setViewSession(s);
    setLastViewSession(s);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Active sessions
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {sessions.length} active session{sessions.length === 1 ? "" : "s"}{" "}
          across all users.
        </p>
      </div>

      <input
        type="search"
        placeholder="Search by email, name, device, or IP…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-neutral-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">IP address</th>
              <th className="px-4 py-3">Signed in</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const expired = new Date(s.expiresAt) < new Date();
              return (
                <tr
                  key={s.id}
                  className="border-t border-slate-200 align-top dark:border-neutral-700"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {s.user?.name ?? "Unknown"}
                    </span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      {s.user?.email}
                    </span>
                    {s.user && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {s.user.role}
                      </span>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <span className="block truncate text-slate-700 dark:text-slate-300">
                      {s.userAgent || "Unknown device"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {s.ipAddress || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(s.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        expired
                          ? "bg-slate-200 text-slate-600 dark:bg-neutral-700 dark:text-slate-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}
                    >
                      {expired ? "Expired" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => openViewer(s)}
                        aria-label={`View details for session of ${s.user?.email ?? s.ipAddress}`}
                        title="View details"
                        className={iconBtnClass}
                      >
                        <Eye className="size-4" />
                      </button>
                      <ActionDropdown
                        label="Session actions"
                        actions={[
                          {
                            label: "Revoke",
                            icon: <MonitorSmartphone className="size-4" />,
                            onClick: () => handleRevoke(s),
                            disabled: busy === `revoke:${s.token}`,
                            danger: true,
                          },
                          s.user
                            ? {
                                label: "Revoke all for user",
                                icon: <MonitorSmartphone className="size-4" />,
                                onClick: () => handleRevokeAllForUser(s.user!.id),
                                disabled: busy === `revokeAll:${s.user.id}`,
                                danger: true,
                              }
                            : {
                                label: "Revoke all for user",
                                icon: <MonitorSmartphone className="size-4" />,
                                onClick: () => {},
                                disabled: true,
                              },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                >
                  No sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={viewSession !== null}
        onClose={() => setViewSession(null)}
        title={
          viewSession
            ? `Session — ${viewSession.user?.name || viewSession.ipAddress || "unknown"}`
            : "Session details"
        }
      >
        {(viewSession ?? lastViewSession) && (
          <SessionDetailDrawer
            session={(viewSession ?? lastViewSession)!}
            onRevoke={() =>
              handleRevoke((viewSession ?? lastViewSession)!)
            }
            onRevokeAll={
              (viewSession ?? lastViewSession)?.user
                ? () =>
                    handleRevokeAllForUser(
                      (viewSession ?? lastViewSession)!.user!.id,
                    )
                : undefined
            }
            busy={busy}
          />
        )}
      </Drawer>
    </div>
  );
}
