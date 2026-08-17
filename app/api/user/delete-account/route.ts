import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
    code?: string;
  } | null;
  const password = typeof body?.password === "string" ? body.password.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, twoFactorEnabled: true },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    if (!code) {
      return Response.json(
        { error: "Enter your 2FA code to confirm" },
        { status: 400 },
      );
    }
    try {
      await auth.api.verifyTOTP({ body: { code }, headers: await headers() });
    } catch {
      return Response.json({ error: "Invalid 2FA code" }, { status: 400 });
    }
  } else {
    const credential = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });
    if (credential) {
      if (!password) {
        return Response.json(
          { error: "Enter your password to confirm" },
          { status: 400 },
        );
      }
      try {
        await auth.api.verifyPassword({
          body: { password },
          headers: await headers(),
        });
      } catch {
        return Response.json({ error: "Incorrect password" }, { status: 400 });
      }
    }
  }

  await prisma.user.delete({ where: { id: user.id } });

  return Response.json({ success: true });
}