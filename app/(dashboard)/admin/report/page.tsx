import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import RiskChart from "@/components/admin/admin-charts";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { guardRole, ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

function scoreColor(score: number | null): string {
  if (score == null)
    return "bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-slate-200";
  if (score >= 0.7) return "bg-red-600 text-white";
  if (score >= 0.4) return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

const CHART_DAYS = 14;
const REPORT_DAYS = 30;

export default async function AdminReportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  guardRole(session?.user.role, [ROLES.ADMIN], "/operator/users");

  const now = new Date();
  const chartSince = new Date(now.getTime() - CHART_DAYS * 86_400_000);
  const reportSince = new Date(now.getTime() - REPORT_DAYS * 86_400_000);

  const [
    totalAttempts,
    successCount,
    failedCount,
    highRiskCount,
    chartAttempts,
    notableAttempts,
    reportAttemptsWithDetails,
  ] = await Promise.all([
    prisma.loginAttempt.count({ where: { createdAt: { gte: reportSince } } }),
    prisma.loginAttempt.count({
      where: { createdAt: { gte: reportSince }, success: true },
    }),
    prisma.loginAttempt.count({
      where: { createdAt: { gte: reportSince }, success: false },
    }),
    prisma.loginAttempt.count({
      where: { createdAt: { gte: reportSince }, riskScore: { gte: 0.7 } },
    }),
    prisma.loginAttempt.findMany({
      where: { createdAt: { gte: chartSince } },
      select: { createdAt: true, success: true, riskScore: true },
    }),
    prisma.loginAttempt.findMany({
      where: { createdAt: { gte: reportSince }, riskScore: { gte: 0.4 } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.loginAttempt.findMany({
      where: { createdAt: { gte: reportSince } },
      select: { country: true, riskReason: true },
    }),
  ]);

  const successRate = totalAttempts
    ? Math.round((successCount / totalAttempts) * 100)
    : 0;

  const dayKeys: string[] = [];
  const dayLabels: string[] = [];
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    dayKeys.push(d.toISOString().slice(0, 10));
    dayLabels.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }

  const daily = dayKeys.map((key, i) => {
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

  const byCountry = new Map<string, number>();
  const byReason = new Map<string, number>();
  for (const a of reportAttemptsWithDetails) {
    if (a.country)
      byCountry.set(a.country, (byCountry.get(a.country) ?? 0) + 1);
    if (a.riskReason) {
      const key = a.riskReason.replace(/^Step-up verification required: /, "");
      byReason.set(key, (byReason.get(key) ?? 0) + 1);
    }
  }
  const topCountries = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topReasons = [...byReason.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxCountry = topCountries[0]?.[1] ?? 0;
  const maxReason = topReasons[0]?.[1] ?? 0;

  const stats = [
    {
      label: "Total attempts",
      value: totalAttempts,
      icon: ShieldAlert,
      sub: `Last ${REPORT_DAYS} days`,
    },
    {
      label: "Success rate",
      value: `${successRate}%`,
      icon: CheckCircle2,
      sub: `${successCount} succeeded`,
    },
    {
      label: "Failed attempts",
      value: failedCount,
      icon: XCircle,
      sub: `${Math.round((failedCount / Math.max(totalAttempts, 1)) * 100)}% of total`,
    },
    {
      label: "High-risk attempts",
      value: highRiskCount,
      icon: ShieldCheck,
      sub: "Risk score ≥ 70",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Security report
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Aggregated login activity and security posture across your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Icon className="size-4" />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.sub}
              </p>
            </div>
          );
        })}
      </div>

      <RiskChart data={daily} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="size-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Top sign-in locations
            </h2>
          </div>
          {topCountries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No location data for the last {REPORT_DAYS} days.
            </p>
          ) : (
            <div className="space-y-3">
              {topCountries.map(([country, count]) => (
                <div key={country}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {country}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.round((count / maxCountry) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="size-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">
              Top risk flags
            </h2>
          </div>
          {topReasons.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No risk flags were raised in the last {REPORT_DAYS} days.
            </p>
          ) : (
            <div className="space-y-3">
              {topReasons.map(([reason, count]) => (
                <div key={reason}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {reason}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${Math.round((count / maxReason) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-slate-300 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">
            Notable sign-in events
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Risk score ≥ 40 · last {REPORT_DAYS} days
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">User</th>
                <th className="px-5 py-2.5 font-medium">Risk</th>
                <th className="px-5 py-2.5 font-medium">Flag</th>
                <th className="px-5 py-2.5 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-700">
              {notableAttempts.map((attempt) => (
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
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColor(attempt.riskScore)}`}
                    >
                      {attempt.riskScore == null
                        ? "—"
                        : `${Math.round(attempt.riskScore * 100)}`}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-5 py-3 text-amber-600 dark:text-amber-400">
                    {attempt.riskReason ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {notableAttempts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No notable sign-in events recorded.
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
