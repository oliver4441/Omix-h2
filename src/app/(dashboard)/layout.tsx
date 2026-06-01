"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-surface bg-animate">
        <Sidebar />
        <div className="lg:ml-64">
          <Header />
          <main className="p-4 lg:p-6 pt-20 lg:pt-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
