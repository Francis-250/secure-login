import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import SecurityPanel from "@/components/user/security-panel";

export default async function UserSecurityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [accounts, cookieStore] = await Promise.all([
    session
      ? prisma.account.findMany({
          where: { userId: session.user.id },
          select: { providerId: true, accountId: true },
        })
      : Promise.resolve([]),
    cookies(),
  ]);
  const lastLoginMethod =
    cookieStore.get("better-auth.last_used_login_method")?.value ?? null;

  return (
    <SecurityPanel
      user={session ? session.user : null}
      accounts={accounts}
      lastLoginMethod={lastLoginMethod}
    />
  );
}