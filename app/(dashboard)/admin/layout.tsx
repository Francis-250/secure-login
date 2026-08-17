"use client";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import React, { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <main className="h-screen">
      <div className="flex items-start h-full">
        <Sidebar isOpen={isSidebarOpen} />
        <div className="w-full h-full">
          <Header
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
          <section className="p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
