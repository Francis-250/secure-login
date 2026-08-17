import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Ban,
  MonitorSmartphone,
  ShieldAlert,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

function scoreColor(score: number | null): string {
  if (score == null) return "bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-slate-200";
  if (score >= 0.7) return "bg-red-600 text-white";
  if (score >= 0.4) return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

export default async function AdminDashboardPage() {
  const now = new Date();

  const [
    totalUsers,
    totalSessions,
    bannedUsers,
    twoFactorUsers,
    highRiskAttempts,
    recentAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.user.count({ where: { banned: true } }),
    prisma.user.count({ where: { twoFactorEnabled: true } }),
    prisma.loginAttempt.count({ where: { riskScore: { gte: 0.7 } } }),
    prisma.loginAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const stats = [
    {
      label: "Total users",
      value: totalUsers,
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Active sessions",
      value: totalSessions,
      href: "/admin/sessions",
      icon: MonitorSmartphone,
    },
    {
      label: "Banned users",
      value: bannedUsers,
      href: "/admin/users?banned=true",
      icon: Ban,
    },
    {
      label: "High-risk attempts",
      value: highRiskAttempts,
      href: "/admin/risk",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Overview of your users, sessions, and security posture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-slate-300 bg-white p-5 transition-colors hover:border-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-500"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Icon className="size-4" />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stat.value}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-slate-300 px-5 py-4 dark:border-neutral-700">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Recent login attempts
            </h2>
            <Link
              href="/admin/risk"
              className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-500"
            >
              View risk log
            </Link>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-neutral-700">
            {recentAttempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                    {attempt.email}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {attempt.user?.name}
                    {attempt.country ? ` · ${attempt.country}` : ""}
                    {attempt.city ? `, ${attempt.city}` : ""} ·{" "}
                    {new Date(attempt.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColor(attempt.riskScore)}`}
                  >
                    {attempt.riskScore == null
                      ? "—"
                      : `${Math.round(attempt.riskScore * 100)}`}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      attempt.success
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {attempt.success ? "OK" : "Fail"}
                  </span>
                </div>
              </li>
            ))}
            {recentAttempts.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No login attempts recorded yet.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-slate-300 px-5 py-4 dark:border-neutral-700">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Security
            </h2>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-neutral-700">
            <li className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                2FA enabled
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                {twoFactorUsers} users
              </span>
            </li>
            <li className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                Banned users
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                {bannedUsers} users
              </span>
            </li>
          </ul>
          <div className="px-5 py-4">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
            >
              <ShieldAlert className="size-4" />
              Manage your account security
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}