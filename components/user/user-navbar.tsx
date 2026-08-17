"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LogOut, Menu, X } from "lucide-react";

interface UserNavbarProps {
  name: string | null;
  email: string;
  image?: string | null;
}

const NAV_ITEMS = [
  { href: "/user", label: "Overview" },
  { href: "/user/security", label: "Security" },
  { href: "/user/sessions", label: "Sessions" },
  { href: "/user/activity", label: "Activity" },
];

export default function UserNavbar({
  name,
  email,
  image,
}: UserNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    setBusy(true);
    await authClient.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-300 bg-white/90 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/90">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/user" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            SL
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            My account
          </span>
        </Link>

        <nav
          className="ml-6 hidden items-center gap-1 md:flex"
          aria-label="Account"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {(name ?? email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                {name ?? "Account"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-neutral-800 dark:hover:text-slate-50 md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-slate-300 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900 md:hidden"
          aria-label="Account"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}