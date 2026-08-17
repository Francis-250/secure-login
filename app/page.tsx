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
    code: "TEL",
    name: "Phone verification",
    desc: "A second channel tied to a number only you control.",
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
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 30 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = seconds / 30;
  const r = 54;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative flex h-55 w-55  items-center justify-center">
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
          stroke="rgba(231,228,217,0.12)"
          strokeWidth="1.5"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#C9A227"
          strokeWidth="1.5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="butt"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.25em] text-[#8A8F86]">
          SECURE LOGIN
        </span>
        <span className="font-mono text-[28px] font-medium tracking-widest text-[#E7E4D9]">
          {code}
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] text-[#3E6F66]">
          EXPIRES 0:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <main
        className="min-h-screen w-full bg-[#14181D] text-[#E7E4D9]"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <span className="font-mono text-[12px] tracking-[0.3em] text-[#8A8F86]">
            ACCESS CONTROL SYSTEM
          </span>
          <Link
            href="/auth/login"
            className="border border-[#C9A227] px-4 py-2 font-mono text-[12px] tracking-widest text-[#C9A227] transition-colors hover:bg-[#C9A227] hover:text-[#14181D]"
          >
            SIGN IN →
          </Link>
        </div>
        <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-14 px-6 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <h1
              className="text-[40px] leading-[1.1] text-[#E7E4D9] md:text-[56px]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Built so a stolen
              <br />
              password isn&apos;t enough.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-[1.6] text-[#B7B4A6]">
              Email, OAuth, one-time codes, and authenticator-app verification —
              layered together, every sign-in logged, every session revocable.
            </p>
            <Link
              href="/login"
              className="mt-9 inline-block bg-[#C9A227] px-7 py-3 font-mono text-[13px] font-medium tracking-widest text-[#14181D] transition-opacity hover:opacity-90"
            >
              CONTINUE TO SIGN IN
            </Link>
          </div>

          <div className="flex justify-center md:justify-end">
            <AuthRing />
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6">
          <div className="h-px w-full bg-[rgba(231,228,217,0.12)]" />
        </div>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <span className="font-mono text-[12px] tracking-[0.3em] text-[#8A8F86]">
            WHAT&apos;S PROTECTING THIS ACCOUNT
          </span>

          <div className="mt-8">
            {FEATURES.map((f, i) => (
              <div
                key={f.code}
                className="grid grid-cols-[80px_1fr] items-start gap-6 border-t border-[rgba(231,228,217,0.12)] py-6 md:grid-cols-[80px_260px_1fr]"
                style={
                  i === FEATURES.length - 1
                    ? { borderBottom: "1px solid rgba(231,228,217,0.12)" }
                    : {}
                }
              >
                <span className="font-mono text-[12px] tracking-widest text-[#3E6F66]">
                  {f.code}
                </span>
                <span
                  className="text-[17px] text-[#E7E4D9]"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                >
                  {f.name}
                </span>
                <span className="text-[14px] leading-normal text-[#8A8F86] md:text-right">
                  {f.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 pb-12">
          <p className="font-mono text-[11px] tracking-[0.15em] text-[#5C6058]">
            SESSION-CTL-04 · No credential is ever trusted alone.
          </p>
        </footer>
      </main>
    </>
  );
}
