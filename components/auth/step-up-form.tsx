"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function StepUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Missing email. Please sign in again.");
      return;
    }
    setLoading(true);
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Device verified");
    router.push("/auth/callbacks");
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email. Please sign in again.");
      return;
    }
    setResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setResending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Code resent");
  };

  return (
    <div className="border border-slate-300 rounded-lg p-6 shadow-sm md:p-6 dark:border-neutral-700">
      <div className="mb-8">
        <h1 className="text-slate-900 text-3xl font-bold mb-4 dark:text-slate-50">
          Verify this device
        </h1>
        <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
          We noticed a new sign-in from this device. Enter the 6-digit code sent
          to {email || "your email"} to continue.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="otp"
            className="mb-2 text-slate-900 font-medium text-sm inline-block dark:text-slate-50"
          >
            Verification code
          </label>
          <input
            type="text"
            id="otp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            required
            autoFocus
            className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700 tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-2.5 px-3.5 text-sm rounded-md font-semibold text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-blue-700 hover:underline text-sm font-medium dark:text-blue-500 disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
        <Link
          href="/auth/login"
          className="text-sm text-slate-500 hover:underline dark:text-slate-400"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
