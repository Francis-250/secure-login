"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Drawer from "@/components/admin/drawer";
import {
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-50";

const cardClass =
  "rounded-lg border border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900";

const labelClass =
  "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Overview() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  const handleSendEmailCode = async () => {
    if (!newEmail.trim()) {
      toast.error("Enter your new email address");
      return;
    }
    setEmailBusy(true);
    const { error } = await authClient.emailOtp.requestEmailChange({
      newEmail: newEmail.trim(),
    });
    setEmailBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmailSent(true);
    toast.success(`Verification code sent to ${newEmail.trim()}`);
  };

  const handleConfirmEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailBusy(true);
    const { error } = await authClient.emailOtp.changeEmail({
      newEmail: newEmail.trim(),
      otp: emailCode.trim(),
    });
    setEmailBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Email address updated");
    setNewEmail("");
    setEmailCode("");
    setEmailSent(false);
  };

  const handleSendPhoneCode = async () => {
    if (!phone.trim()) {
      toast.error("Enter your phone number");
      return;
    }
    setPhoneBusy(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: phone.trim(),
    });
    setPhoneBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPhoneSent(true);
    toast.success("Verification code sent");
  };

  const handleVerifyPhone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhoneBusy(true);
    const { error } = await authClient.phoneNumber.verify({
      phoneNumber: phone.trim(),
      code: phoneCode.trim(),
      updatePhoneNumber: true,
    });
    setPhoneBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Phone number verified");
    setPhone("");
    setPhoneCode("");
    setPhoneSent(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteBusy(true);
    const res = await fetch("/api/user/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(user.twoFactorEnabled
          ? { code: deleteCode.trim() }
          : { password: deletePassword }),
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;
    if (!res.ok || !data?.success) {
      setDeleteBusy(false);
      toast.error(data?.error ?? "Failed to delete account");
      return;
    }
    await authClient.signOut().catch(() => {});
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Account overview
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your profile, email, phone number, and account.
        </p>
      </div>

      <div className={cardClass}>
        <SectionTitle
          icon={<UserRound className="size-5" />}
          title="Profile"
          subtitle="Your name, username, and profile image."
        />
        <div className="mb-5 flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "Avatar"}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
              {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {user.email}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.emailVerified
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {user.emailVerified ? "Email verified" : "Email not verified"}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user.name ?? "No display name"} ·{" "}
              {user.username || "no username"}
            </p>
          </div>
        </div>

        <ProfileForm key={`${user.id}-${user.updatedAt}`} user={user} />
      </div>

      <div className={cardClass}>
        <SectionTitle
          icon={<Mail className="size-5" />}
          title="Email address"
          subtitle="Your current address stays in effect until the new one is verified."
        />
        <p className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
          Current email: <span className="font-medium">{user.email}</span>
        </p>
        {!emailSent ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="newEmail" className={labelClass}>
                New email address
              </label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="new@example.com"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={emailBusy}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {emailBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send verification code
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmEmail} className="space-y-3">
            <div>
              <label htmlFor="emailCode" className={labelClass}>
                Verification code sent to {newEmail}
              </label>
              <input
                id="emailCode"
                inputMode="numeric"
                maxLength={6}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                className={`${inputClass} tracking-widest`}
                placeholder="123456"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  setEmailCode("");
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={emailBusy || emailCode.length !== 6}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {emailBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Verify and change email
              </button>
            </div>
          </form>
        )}
      </div>

      {/* <div className={cardClass}>
        <SectionTitle
          icon={<Smartphone className="size-5" />}
          title="Phone number"
          subtitle="Used for phone sign-in and recovery."
        />
        {user.phoneNumber ? (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
            <Phone className="size-4" />
            <span className="font-medium">{user.phoneNumber}</span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                user.phoneNumberVerified
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
            >
              {user.phoneNumberVerified ? "Verified" : "Not verified"}
            </span>
          </div>
        ) : null}

        {!phoneSent ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="phone" className={labelClass}>
                {user.phoneNumber ? "Change phone number" : "Add phone number"}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+1234567890"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendPhoneCode}
                disabled={phoneBusy}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {phoneBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Phone className="size-4" />
                )}
                Send verification code
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyPhone} className="space-y-3">
            <div>
              <label htmlFor="phoneCode" className={labelClass}>
                Verification code sent to {phone}
              </label>
              <input
                id="phoneCode"
                inputMode="numeric"
                maxLength={6}
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className={`${inputClass} tracking-widest`}
                placeholder="123456"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhoneSent(false);
                  setPhoneCode("");
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={phoneBusy || phoneCode.length !== 6}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {phoneBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Verify phone number
              </button>
            </div>
          </form>
        )}
      </div> */}

      <div className="rounded-lg border border-red-300 bg-white p-6 dark:border-red-900/50 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <Trash2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Delete account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Permanently remove your account, sessions, and all related data.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <Trash2 className="size-4" />
          Delete account
        </button>
      </div>

      <Drawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete account"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200">
            This permanently deletes your account, all sessions, linked
            accounts, and stored data. This cannot be undone.
          </div>

          {user.twoFactorEnabled ? (
            <div>
              <label htmlFor="deleteCode" className={labelClass}>
                Enter your 2FA code to confirm
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="deleteCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  className={`${inputClass} pl-9 tracking-widest`}
                  placeholder="123456"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="deletePassword" className={labelClass}>
                Enter your password to confirm
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="deletePassword"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Your current password"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteBusy}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleteBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete my account
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function ProfileForm({
  user,
}: {
  user: {
    name: string | null;
    username?: string | null;
    image?: string | null;
  };
}) {
  const [name, setName] = useState(user.name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await authClient.updateUser({
      name,
      username: username || undefined,
      image: image || undefined,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Display name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alexsmith"
            className={inputClass}
          />
        </div>
      </div>
      {/* <div>
          <label htmlFor="image" className={labelClass}>
            Profile image URL
          </label>
          <input
            id="image"
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </div> */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save profile
        </button>
      </div>
    </form>
  );
}
