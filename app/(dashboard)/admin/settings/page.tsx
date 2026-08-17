import TwoFactorManager from "@/components/auth/two-factor-manager";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Security
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage two-factor authentication for your own account.
        </p>
      </div>
      <TwoFactorManager />
    </div>
  );
}