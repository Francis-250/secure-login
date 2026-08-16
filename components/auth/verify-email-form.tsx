"use client";

import Link from "next/link";
import { useState } from "react";

export default function VerifyEmailForm() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const updatedCode = [...code];
    updatedCode[index] = value;
    setCode(updatedCode);

    if (value && index < code.length - 1) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg p-6 shadow-sm md:p-8 dark:border-neutral-700">
      <div className="mb-8">
        <h1 className="text-slate-900 text-3xl font-bold mb-4 dark:text-slate-50">
          Verify your email
        </h1>

        <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
          Enter the verification code we sent to your email address.
        </p>
      </div>

      <form className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((value, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(e.target.value, index)}
              className="h-12 w-12 rounded-md border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50"
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Verify email
        </button>
      </form>

      <div className="text-sm text-center mt-6 text-slate-600 dark:text-slate-400">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          className="text-blue-700 hover:underline font-medium dark:text-blue-500"
        >
          Resend code
        </button>
      </div>

      <div className="text-sm text-center mt-4">
        <Link
          href="/auth/login"
          className="text-blue-700 hover:underline font-medium dark:text-blue-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
