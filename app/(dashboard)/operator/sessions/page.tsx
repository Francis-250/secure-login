import { prisma } from "@/lib/prisma";
import SessionsTable from "@/components/admin/sessions-table";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { guardRole, OPERATOR_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function OperatorSessionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  guardRole(session?.user.role, OPERATOR_ROLES, "/admin");

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return <SessionsTable initialSessions={sessions} />;
}