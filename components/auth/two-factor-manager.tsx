"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50";

export default function TwoFactorManager() {
  const { data: session } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  const [password, setPassword] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const twoFactorEnabled = session?.user?.twoFactorEnabled || enabled;

  const handleEnable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await authClient.twoFactor.enable({
      password: password || undefined,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTotpURI(data?.totpURI ?? null);
    setBackupCodes(data?.backupCodes ?? []);
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({
      code,
      trustDevice: true,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setVerified(true);
    toast.success("Two-factor authentication enabled");
  };

  const handleDisable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.twoFactor.disable({
      password: disablePassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Two-factor authentication disabled");
    setEnabled(false);
    setVerified(false);
    setShowDisable(false);
    setDisablePassword("");
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            twoFactorEnabled
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400"
          }`}
        >
          {twoFactorEnabled ? (
            <ShieldCheck className="size-5" />
          ) : (
            <ShieldOff className="size-5" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Two-factor authentication
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {twoFactorEnabled
              ? "Your account is protected by an authenticator app."
              : "Add an extra layer of security to your account."}
          </p>
        </div>
      </div>

      {!twoFactorEnabled && !totpURI && (
        <form onSubmit={handleEnable} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            To enable 2FA, confirm your current password, then scan the QR code
            with your authenticator app (e.g. Google Authenticator).
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Current password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pl-9`}
                placeholder="Your account password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Continue to setup
          </button>
        </form>
      )}

      {totpURI && !verified && (
        <div className="space-y-4">
          <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-700">
            {totpURI ? (
              <QRCodeSVG value={totpURI} size={200} />
            ) : (
              <p className="py-8 text-sm text-slate-500 dark:text-slate-400">
                Could not generate QR code.
              </p>
            )}
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Open your authenticator app and scan the QR code above.</li>
            <li>
              Enter the 6-digit code the app generates below to confirm setup.
            </li>
          </ol>
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Authentication code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputClass} tracking-widest`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Verify and enable
            </button>
          </form>
        </div>
      )}

      {verified && backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200">
            <p className="font-semibold">
              Save these backup codes now — they will not be shown again.
            </p>
            <p className="mt-1">
              Store them somewhere safe. Each code can be used once to sign in if
              you lose access to your authenticator app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-800">
            {backupCodes.map((bc) => (
              <span key={bc} className="text-slate-800 dark:text-slate-200">
                {bc}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={copyBackupCodes}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
          >
            <Copy className="size-4" />
            Copy backup codes
          </button>
        </div>
      )}

      {twoFactorEnabled && (
        <div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
            <span className="font-medium">Enabled</span>
          </div>
          {!showDisable ? (
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <ShieldOff className="size-4" />
              Disable 2FA
            </button>
          ) : (
            <form onSubmit={handleDisable} className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className={inputClass}
                  placeholder="Your account password"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldOff className="size-4" />
                  )}
                  Confirm disable
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisable(false)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}