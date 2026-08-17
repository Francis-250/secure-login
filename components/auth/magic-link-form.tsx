"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck, Send } from "lucide-react";

export default function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/auth/callbacks",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="border border-slate-300 rounded-lg p-6 shadow-sm md:p-6 dark:border-neutral-700">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <MailCheck className="size-6" />
          </span>
          <h1 className="text-slate-900 text-3xl font-bold mb-3 mt-4 dark:text-slate-50">
            Check your email
          </h1>
          <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
            We sent a one-time sign-in link to{" "}
            <span className="font-medium">{email}</span>. Open it to sign in.
            The link expires in 10 minutes.
          </p>
        </div>
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-blue-700 hover:underline font-medium dark:text-blue-500"
          >
            Try again
          </button>{" "}
          or{" "}
          <Link
            href="/auth/login"
            className="text-blue-700 hover:underline font-medium dark:text-blue-500"
          >
            sign in with a password
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 rounded-lg p-6 shadow-sm md:p-6 dark:border-neutral-700">
      <div className="mb-8">
        <h1 className="text-slate-900 text-3xl font-bold mb-4 dark:text-slate-50">
          Sign in with a link
        </h1>
        <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
          Enter your email and we&apos;ll send you a one-time sign-in link. No
          password needed.
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
            placeholder="youremail@gmail.com"
            required
            autoFocus
            className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send sign-in link
        </button>
      </form>

      <div className="text-slate-900 text-sm text-center mt-6 dark:text-slate-50">
        Prefer a password?{" "}
        <Link
          href="/auth/login"
          className="text-blue-700 hover:underline ml-1 font-medium dark:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
