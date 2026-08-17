"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";

interface AdminHeaderProps {
  name: string | null;
  email: string;
  image?: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AdminHeader({
  name,
  email,
  image,
  collapsed,
  onToggleCollapse,
}: AdminHeaderProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { data: session } = authClient.useSession();

  const impersonating = session?.session?.impersonatedBy;

  const handleSignOut = async () => {
    setBusy(true);
    await authClient.signOut();
    router.push("/auth/login");
  };

  const handleStopImpersonating = async () => {
    setBusy(true);
    const { error } = await authClient.admin.stopImpersonating();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Stopped impersonating");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-300 bg-white/90 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/90">
      {impersonating && (
        <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <ShieldCheck className="size-4" />
          <span>
            You are impersonating {name ?? email} — actions are performed on
            their behalf.
          </span>
          <button
            type="button"
            onClick={handleStopImpersonating}
            disabled={busy}
            className="rounded bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
          >
            {busy ? "Stopping…" : "Stop impersonating"}
          </button>
        </div>
      )}

      <div className="flex h-16 items-center gap-4 px-6">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-neutral-800 dark:hover:text-slate-50"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>

        <div className="flex min-w-0 items-center gap-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-9 w-9 rounded-full"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {(name ?? email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {name ?? "Admin"}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {email}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="size-4" />
            Back to site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}