import UsersTable from "@/components/admin/users-table";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { guardRole, OPERATOR_ROLES } from "@/lib/roles";

export default async function OperatorUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  guardRole(session?.user.role, OPERATOR_ROLES, "/admin");

  return <UsersTable />;
}