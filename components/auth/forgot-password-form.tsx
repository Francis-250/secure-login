"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="border border-slate-300 rounded-lg p-6 shadow-sm md:p-8 dark:border-neutral-700">
      <div className="mb-8">
        <h1 className="text-slate-900 text-3xl font-bold mb-4 dark:text-slate-50">
          Forgot password?
        </h1>

        <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-2 text-slate-900 font-medium text-sm inline-block dark:text-slate-50"
          >
            Email
          </label>

          <input
            type="email"
            id="email"
            name="email"
            placeholder="john@readymadeui.com"
            required
            className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Send reset link
        </button>
      </form>

      <div className="text-sm text-center mt-6">
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
