import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UserMessagesPanel from "@/components/user/user-messages-panel";

export const dynamic = "force-dynamic";

export default async function UserMessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  return <UserMessagesPanel userId={session.user.id} />;
}