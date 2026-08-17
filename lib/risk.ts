import { randomUUID } from "crypto";
import { ChatGroq } from "@langchain/groq";
import { prisma } from "./prisma";

export type RiskLevel = "low" | "medium" | "high";

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

export interface AttemptContext {
  email: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
}

const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const LLM_TIMEOUT_MS = 3500;

const RISK_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    level: { type: "string", enum: ["low", "medium", "high"] },
    reasons: { type: "array", items: { type: "string" } },
  },
  required: ["score", "level", "reasons"],
  additionalProperties: false,
} as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

interface Signals {
  history: {
    country: string | null;
    userAgent: string | null;
    createdAt: Date;
  }[];
  recentCount: number;
  stuffing: string[];
}

async function collectSignals(ctx: AttemptContext): Promise<Signals> {
  const since = new Date(Date.now() - HISTORY_WINDOW_MS);

  const history = ctx.userId
    ? await prisma.loginAttempt.findMany({
        where: { userId: ctx.userId, success: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const recentCount = await prisma.loginAttempt.count({
    where: { email: ctx.email, createdAt: { gte: since } },
  });

  let stuffing: string[] = [];
  if (ctx.ipAddress) {
    const rows = await prisma.loginAttempt.findMany({
      where: { ipAddress: ctx.ipAddress, createdAt: { gte: since } },
      select: { email: true },
      distinct: ["email"],
    });
    stuffing = rows.map((r) => r.email);
  }

  return { history, recentCount, stuffing };
}

function heuristicScore(ctx: AttemptContext, signals: Signals): RiskResult {
  const { history, recentCount, stuffing } = signals;
  const reasons: string[] = [];
  let score = 0;

  const hasBaseline = history.length > 0;

  if (hasBaseline && ctx.userAgent) {
    const seen = history.some((a) => a.userAgent === ctx.userAgent);
    if (!seen) {
      score += 0.35;
      reasons.push("New device: this browser/agent has never signed in before");
    }
  }

  if (hasBaseline && ctx.country) {
    const knownCountries = new Set(
      history.map((a) => a.country).filter(Boolean) as string[],
    );
    if (knownCountries.size > 0 && !knownCountries.has(ctx.country)) {
      score += 0.3;
      reasons.push(`New location: first sign-in from ${ctx.country}`);
    }
  }

  if (
    hasBaseline &&
    ctx.country &&
    history[0].country &&
    history[0].country !== ctx.country
  ) {
    const lastMs = history[0].createdAt.getTime();
    const diffHours = (Date.now() - lastMs) / 3600000;
    if (diffHours < 6) {
      score += 0.5;
      reasons.push(
        `Impossible travel: signed in from ${history[0].country} and ${ctx.country} within ${diffHours.toFixed(1)} hours`,
      );
    }
  }

  if (history.length >= 5) {
    const hours = history.map((a) => new Date(a.createdAt).getHours());
    const mean = hours.reduce((s, h) => s + h, 0) / hours.length;
    const std = Math.sqrt(
      hours.reduce((s, h) => s + (h - mean) ** 2, 0) / hours.length,
    );
    const currentHour = new Date().getHours();
    if (std === 0 || Math.abs(currentHour - mean) > 2 * std + 3) {
      score += 0.2;
      reasons.push(
        `Unusual sign-in hour: ${currentHour}:00 vs typical ~${Math.round(mean)}:00`,
      );
    }
  }

  if (recentCount >= 5) {
    score += 0.2;
    reasons.push(`High attempt velocity: ${recentCount} attempts in the last 24h`);
  }

  if (ctx.ipAddress && stuffing.length >= 4) {
    score += 0.4;
    reasons.push(
      `Credential stuffing pattern: ${stuffing.length} distinct emails from this IP in 24h`,
    );
  }

  score = clamp01(score);
  const level: RiskLevel =
    score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";

  return { score, level, reasons };
}

async function assessWithGroq(
  ctx: AttemptContext,
  signals: Signals,
  heuristic: RiskResult,
): Promise<RiskResult | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const { history, recentCount, stuffing } = signals;

  const summary = [
    `Assess the risk of the following email sign-in attempt.`,
    ``,
    `Email: ${ctx.email}`,
    `Registered user: ${ctx.userId ? "yes" : "no"}`,
    `IP address: ${ctx.ipAddress ?? "unknown"}`,
    `Location: ${[ctx.city, ctx.country].filter(Boolean).join(", ") || "unknown"}`,
    `User-Agent: ${ctx.userAgent ?? "unknown"}`,
    `Successful sign-ins in the last 24h for this user: ${history.length}`,
    `Attempts for this email in the last 24h: ${recentCount}`,
    `Distinct emails seen from this IP in the last 24h: ${stuffing.length}`,
    `Heuristic risk score: ${(heuristic.score * 100).toFixed(0)}/100 (${heuristic.level})`,
    heuristic.reasons.length
      ? `Heuristic flags: ${heuristic.reasons.join("; ")}`
      : "Heuristic flags: none",
  ].join("\n");

  try {
    const llm = new ChatGroq({
      model: GROQ_MODEL,
      temperature: 0,
      maxRetries: 0,
    });

    const structured = llm.withStructuredOutput(RISK_SCHEMA);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    let result: {
      score: number;
      level: RiskLevel;
      reasons: string[];
    };
    try {
      result = (await structured.invoke(summary, {
        signal: controller.signal,
      })) as { score: number; level: RiskLevel; reasons: string[] };
    } finally {
      clearTimeout(timer);
    }

    const score = clamp01(Number(result.score) || 0);
    const level: RiskLevel =
      score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
    const reasons = (Array.isArray(result.reasons) ? result.reasons : []).filter(
      (r): r is string => typeof r === "string" && r.length > 0,
    );

    if (reasons.length === 0) return null;

    return { score, level, reasons };
  } catch (error) {
    console.warn("Groq risk assessment failed, using heuristics only:", error);
    return null;
  }
}

export async function evaluateRisk(ctx: AttemptContext): Promise<RiskResult> {
  const signals = await collectSignals(ctx);
  const heuristic = heuristicScore(ctx, signals);

  if (heuristic.level === "high") return heuristic;

  const llm = await assessWithGroq(ctx, signals, heuristic);
  if (!llm) return heuristic;

  const score = clamp01(Math.max(heuristic.score, llm.score));
  const level: RiskLevel =
    score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
  const reasons = [...new Set([...heuristic.reasons, ...llm.reasons])];

  return { score, level, reasons };
}

export interface LogAttemptInput extends AttemptContext {
  success: boolean;
  riskScore?: number | null;
  riskReason?: string | null;
}

export async function logLoginAttempt(input: LogAttemptInput): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      id: randomUUID(),
      email: input.email,
      userId: input.userId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      success: input.success,
      riskScore: input.riskScore ?? null,
      riskReason: input.riskReason ?? null,
    },
  });
}
