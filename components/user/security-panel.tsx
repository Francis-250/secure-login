"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  GitFork,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50";

const labelClass =
  "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function Card({
  icon,
  title,
  subtitle,
  children,
  tone = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  tone?: "blue" | "emerald" | "slate";
}) {
  const toneClass = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    slate: "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function BackupCodes({
  codes,
  onClose,
}: {
  codes: string[];
  onClose: () => void;
}) {
  const copy = async () => {
    await navigator.clipboard.writeText(codes.join("\n"));
    toast.success("Backup codes copied");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200">
        <p className="font-semibold">
          Save these backup codes now — they will not be shown again.
        </p>
        <p className="mt-1">
          Each code works once to sign in if you lose access to your
          authenticator app. Store them somewhere safe.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-800">
        {codes.map((bc) => (
          <span key={bc} className="text-slate-800 dark:text-slate-200">
            {bc}
          </span>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
        >
          <Copy className="size-4" />
          Copy codes
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <CheckCircle2 className="size-4" />
          I saved my codes
        </button>
      </div>
    </div>
  );
}

const LAST_METHOD_LABELS: Record<string, string> = {
  email: "email and password",
  "email-otp": "an email sign-in code",
  github: "GitHub",
  google: "Google",
  credential: "email and password",
};

export default function SecurityPanel({
  user,
  accounts,
  lastLoginMethod,
}: {
  user: {
    id: string;
    email: string;
    twoFactorEnabled?: boolean | null;
  } | null;
  accounts: { providerId: string; accountId: string }[];
  lastLoginMethod: string | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    !!user?.twoFactorEnabled,
  );
  const [enablePassword, setEnablePassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [newCodes, setNewCodes] = useState<string[]>([]);

  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    await run("change-password", async () => {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  };

  const handleEnable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await run("enable", async () => {
      const { data, error } = await authClient.twoFactor.enable({
        password: enablePassword,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setTotpURI(data?.totpURI ?? null);
      setBackupCodes(data?.backupCodes ?? []);
    });
  };

  const handleVerify2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await run("verify", async () => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
        trustDevice: true,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setTwoFactorEnabled(true);
      setTotpURI(null);
      setVerifyCode("");
      toast.success("Two-factor authentication enabled");
    });
  };

  const handleRegenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await run("regenerate", async () => {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({
        password: regeneratePassword,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setNewCodes(data?.backupCodes ?? []);
      setRegeneratePassword("");
    });
  };

  const handleDisable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await run("disable", async () => {
      const { error } = await authClient.twoFactor.disable({
        password: disablePassword,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setTwoFactorEnabled(false);
      setShowDisable(false);
      setDisablePassword("");
      setBackupCodes([]);
      setNewCodes([]);
      toast.success("Two-factor authentication disabled");
    });
  };

  const handleUnlink = async (providerId: string) => {
    await run(`unlink:${providerId}`, async () => {
      const { error } = await authClient.unlinkAccount({ providerId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${providerId} unlinked`);
      window.location.reload();
    });
  };

  const handleLink = (providerId: string) => {
    authClient.linkSocial({
      provider: providerId as "github" | "google",
      callbackURL: "/user/security",
    });
  };

  const PROVIDER_META: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
    credential: { label: "Password", icon: <KeyRound className="size-4" /> },
    github: { label: "GitHub", icon: <GitFork className="size-4" /> },
    google: { label: "Google", icon: <Globe className="size-4" /> },
  };

  const linked = accounts.filter((a) => a.providerId !== "credential");
  const connectedProviders = new Set(accounts.map((a) => a.providerId));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Security
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your password, two-factor authentication, and linked accounts.
        </p>
      </div>

      {lastLoginMethod && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-300">
          <MonitorSmartphone className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            You usually sign in with{" "}
            <span className="font-medium">
              {LAST_METHOD_LABELS[lastLoginMethod] ?? lastLoginMethod}
            </span>
            .
          </p>
        </div>
      )}

      <Card
        icon={<KeyRound className="size-5" />}
        title="Change password"
        subtitle="Set a new password for this account. Your current password is required."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Current password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputClass} pl-9`}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="newPassword" className={labelClass}>
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                minLength={8}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                minLength={8}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy === "change-password"}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === "change-password" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Update password
            </button>
          </div>
        </form>
      </Card>

      <Card
        icon={
          twoFactorEnabled ? (
            <ShieldCheck className="size-5" />
          ) : (
            <ShieldOff className="size-5" />
          )
        }
        title="Two-factor authentication"
        subtitle={
          twoFactorEnabled
            ? "Your account is protected by an authenticator app."
            : "Add an extra layer of security to your account."
        }
        tone={twoFactorEnabled ? "emerald" : "blue"}
      >
        {!twoFactorEnabled && !totpURI && (
          <form onSubmit={handleEnable2FA} className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              To enable 2FA, confirm your password, then scan the QR code with
              your authenticator app and enter the generated code.
            </p>
            <div>
              <label htmlFor="enablePassword" className={labelClass}>
                Current password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="enablePassword"
                  type="password"
                  autoComplete="current-password"
                  value={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.value)}
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy === "enable"}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {busy === "enable" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Enable 2FA
              </button>
            </div>
          </form>
        )}

        {totpURI && !twoFactorEnabled && (
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-700">
              <QRCodeSVG value={totpURI} size={200} />
            </div>
            <BackupCodes codes={backupCodes} onClose={() => setBackupCodes([])} />
            <form onSubmit={handleVerify2FA} className="space-y-3 border-t border-slate-200 pt-4 dark:border-neutral-700">
              <div>
                <label htmlFor="verifyCode" className={labelClass}>
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  id="verifyCode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className={`${inputClass} tracking-widest`}
                  placeholder="123456"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busy === "verify" || verifyCode.length !== 6}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy === "verify" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Verify and enable
                </button>
              </div>
            </form>
          </div>
        )}

        {twoFactorEnabled && !newCodes.length && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
              <span className="font-medium">2FA is enabled</span>
            </div>

            {!showDisable ? (
              <form onSubmit={handleRegenerate} className="space-y-3">
                <div>
                  <label htmlFor="regeneratePassword" className={labelClass}>
                    Confirm your password to generate new backup codes
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="regeneratePassword"
                      type="password"
                      autoComplete="current-password"
                      value={regeneratePassword}
                      onChange={(e) => setRegeneratePassword(e.target.value)}
                      className={`${inputClass} pl-9`}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="submit"
                    disabled={busy === "regenerate"}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
                  >
                    {busy === "regenerate" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Regenerate backup codes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisable(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    <ShieldOff className="size-4" />
                    Disable 2FA
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDisable2FA} className="space-y-3">
                <div>
                  <label htmlFor="disablePassword" className={labelClass}>
                    Confirm your password to disable 2FA
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="disablePassword"
                      type="password"
                      autoComplete="current-password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className={`${inputClass} pl-9`}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDisable(false)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy === "disable"}
                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {busy === "disable" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldOff className="size-4" />
                    )}
                    Disable 2FA
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {twoFactorEnabled && newCodes.length > 0 && (
          <BackupCodes codes={newCodes} onClose={() => setNewCodes([])} />
        )}
      </Card>

      <Card
        icon={<Globe className="size-5" />}
        title="Linked accounts"
        subtitle="Connect or disconnect third-party sign-in providers."
        tone="slate"
      >
        <div className="space-y-3">
          {["password", "github", "google"].map((key) => {
            const provider = key === "password" ? "credential" : key;
            const meta = PROVIDER_META[provider];
            const connected = connectedProviders.has(provider);

            if (provider === "credential") {
              return (
                <div
                  key={provider}
                  className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-neutral-700"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                    {meta.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {meta.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {connected
                        ? "Connected — email and password sign-in"
                        : "Not set up"}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {connected ? "Active" : "Inactive"}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={provider}
                className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-neutral-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                  {meta.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {meta.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {connected ? "Connected" : "Not connected"}
                  </p>
                </div>
                <div className="ml-auto">
                  {connected ? (
                    <button
                      type="button"
                      onClick={() => handleUnlink(provider)}
                      disabled={busy === `unlink:${provider}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
                    >
                      {busy === `unlink:${provider}` ? "Unlinking…" : "Unlink"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLink(provider)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {linked.length} connected provider(s). Unlinking a provider requires
          you to sign in with another method.
        </p>
      </Card>
    </div>
  );
}