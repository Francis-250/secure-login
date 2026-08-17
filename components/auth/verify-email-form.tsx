"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Missing email. Please sign up again.");
      return;
    }
    setLoading(true);
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Email verified");
    router.push("/auth/login");
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email. Please sign up again.");
      return;
    }
    setResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
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
          Verify your email
        </h1>
        <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
          Enter the 6-digit code sent to {email || "your email"}.
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
            className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700 tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-3.5 text-sm rounded-md font-semibold text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-blue-700 hover:underline mt-6 text-sm font-medium dark:text-blue-500 disabled:opacity-60"
      >
        {resending ? "Resending..." : "Resend code"}
      </button>
    </div>
  );
}
