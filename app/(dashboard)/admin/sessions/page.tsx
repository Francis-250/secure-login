import { prisma } from "@/lib/prisma";
import SessionsTable from "@/components/admin/sessions-table";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return <SessionsTable initialSessions={sessions} />;
}