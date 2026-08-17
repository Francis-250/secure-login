"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sessions", label: "Sessions", icon: MonitorSmartphone },
  { href: "/admin/risk", label: "Risk Log", icon: ShieldAlert },
  { href: "/admin/settings", label: "Security", icon: ShieldCheck },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      aria-label="Admin sidebar navigation"
    >
      <div className="flex h-16 items-center border-b border-slate-300 px-5 dark:border-neutral-700">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            SL
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-50"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-300 p-3 text-xs text-slate-500 dark:border-neutral-700 dark:text-slate-400">
        SECURE LOGIN · Admin area
      </div>
    </aside>
  );
}