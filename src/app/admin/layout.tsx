"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  Settings,
  LogOut,
  ChevronLeft,
  Building2,
  Shield,
  Sparkles,
  Menu,
  X,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/schools", label: "Schools", icon: School },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-omix-500/30 border-t-omix-500 rounded-full"
        />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "super_admin") {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-6 py-6", collapsed && "justify-center px-3")}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-omix-500 to-omix-700 flex items-center justify-center glow-sm flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-sm font-bold gradient-text leading-tight">omixsystems</h1>
              <p className="text-[10px] text-gray-500">Admin Panel</p>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Super Admin Badge */}
      {!collapsed && (
        <div className="mx-3 mb-4 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-omix-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Super Admin</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                collapsed && "justify-center px-3",
                active
                  ? "bg-omix-500/15 text-omix-400 border border-omix-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:border hover:border-white/5"
              )}
            >
              {active && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-omix-500/10 to-transparent rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 flex-shrink-0 relative z-10", active && "text-omix-400")} />
              {!collapsed && (
                <span className="text-sm font-medium relative z-10">{item.label}</span>
              )}
              {active && !collapsed && (
                <motion.div
                  layoutId="admin-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-omix-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className={cn("px-3 pb-6", collapsed && "flex justify-center")}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-full py-2 px-4 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all border border-transparent hover:border-white/5 text-sm gap-2"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-gray-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={mobileOpen ? { x: 0 } : { x: -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-surface border-r border-border"
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </motion.aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-surface/80 backdrop-blur-xl border-r border-border z-30 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        collapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-surface/70 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-omix-400" />
                <span className="text-sm text-gray-400">
                  Super Admin Dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-2 border border-border">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-omix-500 to-omix-700 flex items-center justify-center text-white text-xs font-bold">
                  {session?.user?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-gray-200 leading-tight">
                    {session?.user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-amber-400">Super Admin</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Main App</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-animate">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
