import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAiRequestCount, getSettings, updateSettings } from "@/lib/settings";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const [settings, aiRequestCount] = await Promise.all([
    getSettings(),
    getAiRequestCount(),
  ]);
  return Response.json({ settings, aiRequestCount });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: { maxFailedAttempts?: number; aiRiskEnabled?: boolean } = {};

  if (body.maxFailedAttempts !== undefined) {
    const n = Number(body.maxFailedAttempts);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      return Response.json(
        { error: "maxFailedAttempts must be an integer between 1 and 100" },
        { status: 400 },
      );
    }
    patch.maxFailedAttempts = n;
  }

  if (body.aiRiskEnabled !== undefined) {
    if (typeof body.aiRiskEnabled !== "boolean") {
      return Response.json(
        { error: "aiRiskEnabled must be a boolean" },
        { status: 400 },
      );
    }
    patch.aiRiskEnabled = body.aiRiskEnabled;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [settings, aiRequestCount] = await Promise.all([
    updateSettings(patch),
    getAiRequestCount(),
  ]);

  return Response.json({ settings, aiRequestCount });
}