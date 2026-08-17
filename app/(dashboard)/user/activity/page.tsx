import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

function parseDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  const os = /Windows NT/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  return `${browser} on ${os}`;
}

export default async function UserActivityPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const attempts = await prisma.loginAttempt.findMany({
    where: {
      OR: [{ userId: session?.user.id }, { email: session?.user.email }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Sign-in activity
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Recent sign-in attempts on your account over the last 50 events.
        </p>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">Time</th>
                <th className="px-5 py-2.5 font-medium">Device</th>
                <th className="px-5 py-2.5 font-medium">Location</th>
                <th className="px-5 py-2.5 font-medium">Result</th>
                <th className="px-5 py-2.5 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-700">
              {attempts.map((attempt) => {
                const flagged = attempt.riskReason || (attempt.riskScore ?? 0) >= 0.7;
                return (
                  <tr key={attempt.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(attempt.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {parseDevice(attempt.userAgent)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {attempt.country
                        ? `${attempt.city ? `${attempt.city}, ` : ""}${attempt.country}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          attempt.success
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {attempt.success ? "Successful" : "Failed"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {flagged ? (
                        <span className="inline-flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                          <span>
                            {attempt.success
                              ? `Flagged — ${attempt.riskReason}`
                              : attempt.riskReason
                                ? `Blocked — ${attempt.riskReason}`
                                : "Blocked — flagged for review"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {attempts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No sign-in activity recorded yet.
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