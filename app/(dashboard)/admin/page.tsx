import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Ban,
  MonitorSmartphone,
  ShieldAlert,
  Users,
} from "lucide-react";
import RiskChart from "@/components/admin/admin-charts";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { guardRole, ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

function scoreColor(score: number | null): string {
  if (score == null) return "bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-slate-200";
  if (score >= 0.7) return "bg-red-600 text-white";
  if (score >= 0.4) return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

const CHART_DAYS = 14;

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  guardRole(session?.user.role, [ROLES.ADMIN], "/operator/users");

  const now = new Date();
  const chartSince = new Date(now.getTime() - CHART_DAYS * 86_400_000);

  const [
    totalUsers,
    totalSessions,
    bannedUsers,
    highRiskAttempts,
    recentAttempts,
    chartAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.user.count({ where: { banned: true } }),
    prisma.loginAttempt.count({ where: { riskScore: { gte: 0.7 } } }),
    prisma.loginAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
    prisma.loginAttempt.findMany({
      where: { createdAt: { gte: chartSince } },
      select: { createdAt: true, success: true, riskScore: true },
    }),
  ]);

  const dayKeys: string[] = [];
  const dayLabels: string[] = [];
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    dayKeys.push(d.toISOString().slice(0, 10));
    dayLabels.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }

  const dailyRisk = dayKeys.map((key, i) => {
    const attemptsOnDay = chartAttempts.filter(
      (a) => a.createdAt.toISOString().slice(0, 10) === key,
    );
    const buckets = { none: 0, low: 0, medium: 0, high: 0 };
    let sum = 0;
    let scored = 0;
    for (const a of attemptsOnDay) {
      const s = a.riskScore;
      if (s == null) buckets.none++;
      else {
        if (s >= 0.7) buckets.high++;
        else if (s >= 0.4) buckets.medium++;
        else buckets.low++;
        sum += s;
        scored++;
      }
    }
    return {
      date: dayLabels[i],
      ...buckets,
      avgRisk: scored ? Math.round((sum / scored) * 100) / 100 : 0,
    };
  });

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
      href: "/admin/report",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-8">
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
          const inner = (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Icon className="size-4" />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-slate-300 bg-white p-5 transition-colors hover:border-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-500"
            >
              {inner}
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stat.value}
              </p>
            </Link>
          ) : (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {inner}
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <RiskChart data={dailyRisk} />

      <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-slate-300 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">
            Recent login attempts
          </h2>
          <Link
            href="/admin/report"
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-500"
          >
            View report
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">User</th>
                <th className="px-5 py-2.5 font-medium">Location</th>
                <th className="px-5 py-2.5 font-medium">Risk</th>
                <th className="px-5 py-2.5 font-medium">Result</th>
                <th className="px-5 py-2.5 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-700">
              {recentAttempts.map((attempt) => (
                <tr key={attempt.id} className="align-top">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      {attempt.email}
                    </p>
                    {attempt.user?.name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {attempt.user.name}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {attempt.country
                      ? `${attempt.city ? `${attempt.city}, ` : ""}${attempt.country}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColor(attempt.riskScore)}`}
                    >
                      {attempt.riskScore == null
                        ? "—"
                        : `${Math.round(attempt.riskScore * 100)}`}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        attempt.success
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {attempt.success ? "OK" : "Fail"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {recentAttempts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No login attempts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}