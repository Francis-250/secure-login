import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/admin-header";
import AdminSidebar from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/user");
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950">
      <div className="flex items-start">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminHeader
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
          <section className="p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}