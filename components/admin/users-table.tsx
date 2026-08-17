"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Eye,
  KeyRound,
  Loader2,
  ShieldOff,
  Trash2,
  UserPlus,
  UserRoundCog,
  X,
} from "lucide-react";
import ActionDropdown from "@/components/admin/dropdown-menu";
import Drawer from "@/components/admin/drawer";
import UserDetailDrawer, {
  type AdminUser,
} from "@/components/admin/user-detail-drawer";

type CreateUserData = {
  email: string;
  name: string;
  password: string;
  role: string;
};

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-neutral-800 dark:hover:text-slate-50"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50";

export const actionBtnClass =
  "inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800";

export const iconBtnClass =
  "rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-neutral-800 dark:hover:text-slate-50";

export default function UsersTable() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"email" | "name">("email");
  const [roleFilter, setRoleFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [lastViewUser, setLastViewUser] = useState<AdminUser | null>(null);

  const { data: session } = authClient.useSession();
  const impersonating = session?.session?.impersonatedBy;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await authClient.admin.listUsers({
      query: {
        searchValue: search || undefined,
        searchField: search ? searchField : undefined,
        searchOperator: search ? "contains" : undefined,
        filterField: roleFilter ? "role" : undefined,
        filterValue: roleFilter || undefined,
        sortBy: "createdAt",
        sortDirection: "desc",
        limit: 100,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((data?.users as unknown as AdminUser[]) ?? []);
    setTotal(data?.total ?? 0);
  }, [search, searchField, roleFilter]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(id);
  }, [fetchUsers]);

  const visibleUsers = bannedFilter
    ? users.filter((u) =>
        bannedFilter === "banned" ? u.banned : !u.banned,
      )
    : users;

  const runAction = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const openViewer = (user: AdminUser) => {
    setViewUser(user);
    setLastViewUser(user);
  };

  const updateUserInList = (updated: AdminUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u)),
    );
  };

  const handleUnban = async (user: AdminUser) => {
    await runAction(`unban:${user.id}`, async () => {
      const { error } = await authClient.admin.unbanUser({ userId: user.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Unbanned ${user.email}`);
      fetchUsers();
    });
  };

  const handleBan = async (
    user: AdminUser,
    reason: string,
    expiresIn?: number,
  ) => {
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
      setBanTarget(null);
      fetchUsers();
    });
  };

  const handleDelete = async (user: AdminUser) => {
    await runAction(`delete:${user.id}`, async () => {
      const { error } = await authClient.admin.removeUser({ userId: user.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Deleted ${user.email}`);
      setDeleteTarget(null);
      if (viewUser?.id === user.id) setViewUser(null);
      fetchUsers();
    });
  };

  const handleSetPassword = async (user: AdminUser, newPassword: string) => {
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
      setPasswordTarget(null);
    });
  };

  const handleImpersonate = async (user: AdminUser) => {
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

  const handleCreateUser = async (data: CreateUserData) => {
    await runAction("create-user", async () => {
      const { error } = await authClient.admin.createUser({
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role as "user" | "admin",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Created ${data.email}`);
      setCreateOpen(false);
      fetchUsers();
    });
  };

  const handleStopImpersonating = async () => {
    await runAction("stop-impersonating", async () => {
      const { error } = await authClient.admin.stopImpersonating();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Stopped impersonating");
      fetchUsers();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Users
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {total} user{total === 1 ? "" : "s"} found.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <UserPlus className="size-4" />
          Create user
        </button>
      </div>

      {impersonating && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          <UserRoundCog className="size-5" />
          <span>
            You are impersonating a user. Actions are performed on their behalf.
          </span>
          <button
            type="button"
            onClick={handleStopImpersonating}
            disabled={busy === "stop-impersonating"}
            className="ml-auto rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {busy === "stop-impersonating" ? "Stopping…" : "Stop impersonating"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-neutral-700">
          <input
            type="search"
            placeholder={`Search by ${searchField}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:bg-neutral-800 dark:text-slate-50"
          />
          <select
            value={searchField}
            onChange={(e) =>
              setSearchField(e.target.value as "email" | "name")
            }
            className="border-l border-slate-300 bg-slate-50 px-2 py-2 text-sm text-slate-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
            aria-label="Search field"
          >
            <option value="email">Email</option>
            <option value="name">Name</option>
          </select>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          value={bannedFilter}
          onChange={(e) => setBannedFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="banned">Banned</option>
          <option value="active">Active</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-neutral-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">2FA</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const rowBusy =
                busy === `impersonate:${user.id}` ||
                busy === `unban:${user.id}` ||
                busy === `delete:${user.id}` ||
                busy === `password:${user.id}` ||
                busy === `ban:${user.id}`;
              return (
                <tr
                  key={user.id}
                  className="border-t border-slate-200 align-top dark:border-neutral-700"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openViewer(user)}
                      className="block max-w-xs text-left"
                      title="View details"
                    >
                      <span className="font-medium text-slate-900 hover:underline dark:text-slate-50">
                        {user.name}
                      </span>
                      <span className="block truncate text-slate-500 dark:text-slate-400">
                        {user.email}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {user.role ?? "user"}
                  </td>
                  <td className="px-4 py-3">
                    {user.emailVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.twoFactorEnabled ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-neutral-600">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.banned
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}
                    >
                      {user.banned ? "Banned" : "Active"}
                    </span>
                    {user.banned && user.banReason && (
                      <span className="mt-1 block max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.banReason}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => openViewer(user)}
                        aria-label={`View details for ${user.email}`}
                        title="View details"
                        className={iconBtnClass}
                      >
                        <Eye className="size-4" />
                      </button>
                      <ActionDropdown
                        label={`Actions for ${user.email}`}
                        actions={[
                          user.banned
                            ? {
                                label: "Unban",
                                icon: <ShieldOff className="size-4" />,
                                onClick: () => handleUnban(user),
                                disabled: busy === `unban:${user.id}`,
                              }
                            : {
                                label: "Ban",
                                icon: <Ban className="size-4" />,
                                onClick: () => setBanTarget(user),
                                disabled: rowBusy,
                                danger: true,
                              },
                          {
                            label: "Set password",
                            icon: <KeyRound className="size-4" />,
                            onClick: () => setPasswordTarget(user),
                            disabled: rowBusy,
                          },
                          {
                            label: "Impersonate",
                            icon: <UserRoundCog className="size-4" />,
                            onClick: () => handleImpersonate(user),
                            disabled: busy === `impersonate:${user.id}`,
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="size-4" />,
                            onClick: () => setDeleteTarget(user),
                            disabled: rowBusy,
                            danger: true,
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && visibleUsers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                >
                  No users match the current filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                >
                  Loading users…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Create user" onClose={() => setCreateOpen(false)}>
          <CreateUserForm
            busy={busy === "create-user"}
            onSubmit={handleCreateUser}
          />
        </Modal>
      )}

      {banTarget && (
        <Modal title={`Ban ${banTarget.email}`} onClose={() => setBanTarget(null)}>
          <BanForm
            busy={busy === `ban:${banTarget.id}`}
            onSubmit={(reason, expiresIn) => handleBan(banTarget, reason, expiresIn)}
          />
        </Modal>
      )}

      {passwordTarget && (
        <Modal
          title={`Set password for ${passwordTarget.email}`}
          onClose={() => setPasswordTarget(null)}
        >
          <PasswordForm
            busy={busy === `password:${passwordTarget.id}`}
            onSubmit={(pw) => handleSetPassword(passwordTarget, pw)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete user"
          onClose={() => setDeleteTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Permanently delete{" "}
              <span className="font-semibold">{deleteTarget.email}</span>? This
              removes the account, sessions, and all related data. This cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className={actionBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                disabled={busy === `delete:${deleteTarget.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {busy === `delete:${deleteTarget.id}` ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Delete user
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Drawer
        open={viewUser !== null}
        onClose={() => setViewUser(null)}
        title={
          viewUser
            ? `User — ${viewUser.name || viewUser.email}`
            : "User details"
        }
      >
        {(viewUser ?? lastViewUser) && (
          <UserDetailDrawer
            key={(viewUser ?? lastViewUser)!.id}
            user={(viewUser ?? lastViewUser)!}
            onUserChanged={updateUserInList}
          />
        )}
      </Drawer>
    </div>
  );
}

function CreateUserForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (data: CreateUserData) => void;
}) {
  const [form, setForm] = useState<CreateUserData>({
    email: "",
    name: "",
    password: "",
    role: "user",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Name
        </label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
        </label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
          placeholder="jane@example.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Temporary password
        </label>
        <input
          required
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Role
        </label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className={inputClass}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Create user
        </button>
      </div>
    </form>
  );
}

export function BanForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (reason: string, expiresIn?: number) => void;
}) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");

  const durationSeconds: Record<string, number | undefined> = {
    "": undefined,
    "1h": 3600,
    "24h": 86400,
    "7d": 604800,
    "30d": 2592000,
    forever: -1,
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const seconds = durationSeconds[duration];
        onSubmit(reason, seconds === undefined || seconds === -1 ? undefined : seconds);
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Reason
        </label>
        <textarea
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
          rows={3}
          placeholder="Why is this user being banned?"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Ban duration
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className={inputClass}
        >
          <option value="">Forever</option>
          <option value="1h">1 hour</option>
          <option value="24h">24 hours</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
          Confirm ban
        </button>
      </div>
    </form>
  );
}

export function PasswordForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) {
          toast.error("Passwords do not match");
          return;
        }
        onSubmit(password);
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          New password
        </label>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Confirm new password
        </label>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Save password
        </button>
      </div>
    </form>
  );
}
