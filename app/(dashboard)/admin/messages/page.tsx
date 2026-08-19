import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { guardRole, ROLES } from "@/lib/roles";
import MessagesPanel from "@/components/admin/messages-panel";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  guardRole(session?.user.role, [ROLES.ADMIN], "/operator/users");

  const { userId } = await searchParams;

  return <MessagesPanel initialUserId={userId} />;
}