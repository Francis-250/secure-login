"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MonitorSmartphone,
  ShieldAlert,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/operator/users", label: "Users", icon: Users },
  { href: "/operator/sessions", label: "Sessions", icon: MonitorSmartphone },
  { href: "/operator/risk", label: "Risk Log", icon: ShieldAlert },
];

export default function OperatorSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-300 bg-white transition-[width] duration-200 dark:border-neutral-700 dark:bg-neutral-900 ${
        collapsed ? "w-16" : "w-60"
      }`}
      aria-label="Operator sidebar navigation"
    >
      <div
        className={`flex h-16 items-center border-b border-slate-300 dark:border-neutral-700 ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        <Link
          href="/operator/users"
          className="flex items-center gap-2"
          title={collapsed ? "Operator" : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            SL
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Operator
            </span>
          )}
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
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-2" : ""
              } ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-50"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-slate-300 p-3 text-xs text-slate-500 dark:border-neutral-700 dark:text-slate-400">
          SECURE LOGIN · Operator area
        </div>
      )}
    </aside>
  );
}