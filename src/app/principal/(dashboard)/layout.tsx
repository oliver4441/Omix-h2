"use client";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  FlaskConical,
  Banknote,
  Monitor,
  Users,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  ClipboardList,
  GraduationCap,
  Library,
  FlaskRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const PRINCIPAL_NAV_ITEMS: NavItem[] = [
  { href: "/principal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/principal/dashboard/departments", label: "All Departments", icon: Building2 },
  { href: "/principal/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/principal/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/principal/dashboard/settings", label: "Settings", icon: Settings },
];

// Quick department links shown in a sub-section
const DEPARTMENT_LINKS = [
  { href: "/bursar/dashboard", label: "Bursar", icon: Banknote, color: "from-emerald-500 to-emerald-700" },
  { href: "/library/dashboard", label: "Library", icon: Library, color: "from-amber-500 to-amber-700" },
  { href: "/science-lab/dashboard", label: "Science Lab", icon: FlaskConical, color: "from-cyan-500 to-cyan-700" },
  { href: "/computer-lab/dashboard", label: "Computer Lab", icon: Monitor, color: "from-purple-500 to-purple-700" },
  { href: "/board/dashboard", label: "Board", icon: Building2, color: "from-blue-500 to-blue-700" },
];

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/principal/dashboard") {
      return pathname === "/principal/dashboard";
    }
    return pathname.startsWith(href + "/") || pathname === href;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <Link href="/principal/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center glow-sm flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="text-sm font-bold gradient-text leading-tight">Principal</h1>
            <p className="text-[10px] text-gray-500">omixsystems</p>
          </motion.div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 mb-2">
          Command Center
        </p>
        {PRINCIPAL_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                active
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:border hover:border-white/5"
              )}
            >
              {active && (
                <motion.div
                  layoutId="principal-sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <ItemIcon className={cn("w-5 h-5 flex-shrink-0 relative z-10", active && "text-indigo-400")} />
              <span className="text-sm font-medium relative z-10">{item.label}</span>
            </Link>
          );
        })}

        {/* Department Quick Links */}
        <div className="pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 mb-2">
            Departments
          </p>
          {DEPARTMENT_LINKS.map((dept) => {
            const DeptIcon = dept.icon;
            return (
              <Link
                key={dept.href}
                href={dept.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all text-sm"
              >
                <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center", dept.color)}>
                  <DeptIcon className="w-3.5 h-3.5 text-white" />
                </div>
                {dept.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Settings */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href="/principal/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
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

      {/* Desktop sidebar - non-collapsible */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-surface/80 backdrop-blur-xl border-r border-border z-30">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
