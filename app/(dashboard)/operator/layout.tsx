import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OperatorShell from "@/components/admin/operator-shell";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  if (session.user.role !== "operator") {
    redirect("/user");
  }

  return (
    <OperatorShell
      name={session.user.name}
      email={session.user.email}
      image={session.user.image}
    >
      {children}
    </OperatorShell>
  );
}