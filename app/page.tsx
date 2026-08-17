"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    code: "PWD",
    name: "Password + email verification",
    desc: "Hashed and salted. Never stored, never logged in plain text.",
  },
  {
    code: "OAUTH",
    name: "Google & GitHub sign-in",
    desc: "Skip the password entirely — authenticate through a provider you already trust.",
  },
  {
    code: "OTP",
    name: "Email one-time codes",
    desc: "Six digits, sent on demand, expires in 20 minutes.",
  },
  {
    code: "TOTP",
    name: "Authenticator app codes",
    desc: "Google Authenticator. A new code every 30 seconds, generated offline.",
  },
  {
    code: "RISK",
    name: "Behavior-based step-up",
    desc: "Repeated failed attempts trigger mandatory verification — before a session ever opens.",
  },
  {
    code: "RBAC",
    name: "Role-based admin access",
    desc: "Admin surfaces stay closed to everyone but admins.",
  },
];

function AuthRing() {
  const [seconds, setSeconds] = useState(23);
  const [code] = useState("247 391");

  useEffect(() => {
    const id = setInterval(
      () => setSeconds((s) => (s <= 0 ? 30 : s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const pct = seconds / 30;
  const r = 54;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative flex h-55 w-55 items-center justify-center">
      <svg
        width="220"
        height="220"
        viewBox="0 0 120 120"
        className="-rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className="stroke-slate-200 dark:stroke-neutral-800"
          strokeWidth="1.5"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className="stroke-sky-600 dark:stroke-sky-400"
          strokeWidth="1.5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="butt"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.25em] text-slate-500 dark:text-neutral-400">
          SECURE LOGIN
        </span>
        <span className="font-mono text-[28px] font-medium tracking-widest text-slate-900 dark:text-slate-50">
          {code}
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
          EXPIRES 0:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-white text-slate-900 dark:bg-neutral-950 dark:text-slate-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <span className="font-mono text-[12px] tracking-[0.3em] text-slate-500 dark:text-neutral-400">
          SECURE LOGIN
        </span>
        <Link
          href="/auth/login"
          className="border border-sky-600 px-4 py-2 font-mono text-[12px] tracking-widest text-sky-600 transition-colors hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-400 dark:hover:text-neutral-950"
        >
          SIGN IN →
        </Link>
      </div>

      <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-14 px-6 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <h1 className="font-serif text-[40px] font-medium leading-[1.1] text-slate-900 dark:text-slate-50 md:text-[56px]">
            Built so a stolen
            <br />
            password isn&apos;t enough.
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-[1.6] text-slate-600 dark:text-neutral-400">
            Email, OAuth, one-time codes, and authenticator-app verification —
            layered together, every sign-in logged, every session revocable.
          </p>
          <Link
            href="/auth/login"
            className="mt-9 inline-block bg-sky-600 px-7 py-3 font-mono text-[13px] font-medium tracking-widest text-white transition-opacity hover:opacity-90 dark:bg-sky-400 dark:text-neutral-950"
          >
            CONTINUE TO SIGN IN
          </Link>
        </div>

        <div className="flex justify-center md:justify-end">
          <AuthRing />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px w-full bg-slate-200 dark:bg-neutral-800" />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <span className="font-mono text-[12px] tracking-[0.3em] text-slate-500 dark:text-neutral-400">
          WHAT&apos;S PROTECTING THIS ACCOUNT
        </span>

        <div className="relative mt-10">
          {/* Vertical timeline line */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-200 dark:bg-neutral-800" />

          <div className="space-y-12">
            {FEATURES.map((f, i) => (
              <div
                key={f.code}
                className={`relative flex items-center ${
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-1/2 z-10 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-600 bg-white dark:border-sky-400 dark:bg-neutral-950">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-sky-600 dark:text-sky-400">
                    {f.code}
                  </span>
                </div>

                {/* Card */}
                <div
                  className={`w-[calc(50%-3rem)] ${
                    i % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                  }`}
                >
                  <div
                    className={`rounded-lg border border-slate-200 p-5 transition-all hover:border-sky-400 hover:shadow-lg dark:border-neutral-800 dark:hover:border-sky-500 ${
                      i % 2 === 0
                        ? "hover:-translate-x-1"
                        : "hover:translate-x-1"
                    }`}
                  >
                    <h3 className="font-serif text-[18px] font-medium text-slate-900 dark:text-slate-50">
                      {f.name}
                    </h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-slate-600 dark:text-neutral-400">
                      {f.desc}
                    </p>
                  </div>
                </div>

                {/* Empty spacer to maintain layout */}
                <div className="w-[calc(50%-3rem)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 pb-12">
        <p className="font-mono text-[11px] tracking-[0.15em] text-slate-400 dark:text-neutral-600">
          SESSION-CTL-04 · No credential is ever trusted alone.
        </p>
      </footer>
    </main>
  );
}
