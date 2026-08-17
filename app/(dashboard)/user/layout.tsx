import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UserNavbar from "@/components/user/user-navbar";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950">
      <UserNavbar
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
      />
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}