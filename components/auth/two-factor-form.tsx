"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function TwoFactorForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.twoFactor.verifyTotp({
      code,
      trustDevice: true,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.push("/auth/callbacks");
  };

  return (
    <div className="border border-slate-300 rounded-lg p-6 shadow-sm md:p-6 dark:border-neutral-700 w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-slate-900 text-3xl font-bold mb-4 dark:text-slate-50">
          Two-factor verification
        </h1>
        <p className="text-slate-600 text-base leading-relaxed dark:text-slate-400">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="code"
            className="mb-2 text-slate-900 font-medium text-sm inline-block dark:text-slate-50"
          >
            Authentication code
          </label>
          <input
            type="text"
            id="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            required
            autoFocus
            className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700 tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-2.5 px-3.5 text-sm rounded-md font-semibold text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
