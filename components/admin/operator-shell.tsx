"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/admin-header";
import OperatorSidebar from "@/components/admin/operator-sidebar";

interface OperatorShellProps {
  name: string | null;
  email: string;
  image?: string | null;
  children: React.ReactNode;
}

export default function OperatorShell({
  name,
  email,
  image,
  children,
}: OperatorShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950">
      <div className="flex items-start">
        <OperatorSidebar collapsed={collapsed} />
        <div className="min-w-0 flex-1">
          <AdminHeader
            name={name}
            email={email}
            image={image}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
          <section className="p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}