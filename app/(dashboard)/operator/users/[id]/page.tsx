import UserDetail from "@/components/admin/user-detail";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { guardRole, OPERATOR_ROLES } from "@/lib/roles";

export default async function OperatorUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  guardRole(session?.user.role, OPERATOR_ROLES, "/admin");

  return <UserDetail userId={id} />;
}