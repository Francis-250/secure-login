import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "operator") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const userId = url.searchParams.get("userId") ?? undefined;
  const minRiskParam = url.searchParams.get("minRisk");
  const minRisk = minRiskParam ? Number(minRiskParam) : undefined;

  const attempts = await prisma.loginAttempt.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(minRisk !== undefined && !Number.isNaN(minRisk)
        ? { riskScore: { gte: minRisk } }
        : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { riskReason: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return Response.json(attempts);
}