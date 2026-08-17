import { prisma } from "./prisma";

export interface AppSettings {
  maxFailedAttempts: number;
  aiRiskEnabled: boolean;
}

const DEFAULTS: AppSettings = {
  maxFailedAttempts: 5,
  aiRiskEnabled: true,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["maxFailedAttempts", "aiRiskEnabled"] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const rawMax = map.get("maxFailedAttempts");
  const parsedMax = rawMax ? Number(rawMax) : NaN;

  const rawAi = map.get("aiRiskEnabled");

  return {
    maxFailedAttempts:
      Number.isInteger(parsedMax) && parsedMax >= 1 && parsedMax <= 100
        ? parsedMax
        : DEFAULTS.maxFailedAttempts,
    aiRiskEnabled: rawAi ? rawAi === "true" : DEFAULTS.aiRiskEnabled,
  };
}

export async function updateSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const ops: ReturnType<typeof upsertSetting>[] = [];

  if (patch.maxFailedAttempts !== undefined) {
    const v = Math.min(100, Math.max(1, Math.round(patch.maxFailedAttempts)));
    ops.push(
      upsertSetting("maxFailedAttempts", String(v)),
    );
  }

  if (patch.aiRiskEnabled !== undefined) {
    ops.push(
      upsertSetting("aiRiskEnabled", String(Boolean(patch.aiRiskEnabled))),
    );
  }

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  return getSettings();
}

function upsertSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getAiRequestCount(): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { key: "aiRequestCount" },
  });
  const n = row ? Number(row.value) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export async function incrementAiRequestCount(): Promise<void> {
  const row = await prisma.setting.findUnique({
    where: { key: "aiRequestCount" },
  });
  const current = row ? Number(row.value) : 0;
  const next =
    (Number.isInteger(current) && current >= 0 ? current : 0) + 1;
  await upsertSetting("aiRequestCount", String(next));
}