import SettingsManager from "@/components/admin/settings-manager";
import TwoFactorManager from "@/components/auth/two-factor-manager";
import { getAiRequestCount, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, aiRequestCount] = await Promise.all([
    getSettings(),
    getAiRequestCount(),
  ]);
  const aiModel = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  return (
    <div className="mx-auto  space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Security settings
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Configure sign-in policy and AI risk assessment for your workspace.
        </p>
      </div>

      <SettingsManager
        initialSettings={settings}
        initialAiRequestCount={aiRequestCount}
        aiModel={aiModel}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          Your account
        </h2>
        <TwoFactorManager />
      </div>
    </div>
  );
}