"use client";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Banknote,
  Monitor,
  Users,
  Calendar,
  Bot,
  Bell,
  Settings,
  Menu,
  X,
  ClipboardList,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";

interface DepartmentConfig {
  name: string;
  slug: string;
  icon: React.ElementType;
  color: string;
  navItems: { href: string; label: string; icon: React.ElementType }[];
}

const DEPARTMENT_CONFIGS: Record<string, DepartmentConfig> = {
  bursar: {
    name: "Bursar",
    slug: "bursar",
    icon: Banknote,
    color: "from-emerald-500 to-emerald-700",
    navItems: [
      { href: "/bursar/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/bursar/dashboard/payments", label: "Payments", icon: Banknote },
      { href: "/bursar/dashboard/structures", label: "Fee Structures", icon: ClipboardList },
      { href: "/bursar/dashboard/students", label: "Student Balances", icon: Users },
    ],
  },
  library: {
    name: "Library",
    slug: "library",
    icon: BookOpen,
    color: "from-amber-500 to-amber-700",
    navItems: [
      { href: "/library/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/library/dashboard/books", label: "Books", icon: BookOpen },
      { href: "/library/dashboard/checkouts", label: "Checkouts", icon: Users },
    ],
  },
  "science-lab": {
    name: "Science Lab",
    slug: "science-lab",
    icon: FlaskConical,
    color: "from-cyan-500 to-cyan-700",
    navItems: [
      { href: "/science-lab/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/science-lab/dashboard/apparatus", label: "Apparatus", icon: FlaskConical },
      { href: "/science-lab/dashboard/logs", label: "Activity Log", icon: ClipboardList },
    ],
  },
  "computer-lab": {
    name: "Computer Lab",
    slug: "computer-lab",
    icon: Monitor,
    color: "from-purple-500 to-purple-700",
    navItems: [
      { href: "/computer-lab/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/computer-lab/dashboard/students", label: "Students", icon: Users },
    ],
  },
  board: {
    name: "Board of Management",
    slug: "board",
    icon: Building2,
    color: "from-blue-500 to-blue-700",
    navItems: [
      { href: "/board/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/board/dashboard/meetings", label: "Meetings", icon: Calendar },
      { href: "/board/dashboard/minutes", label: "Minutes", icon: ClipboardList },
      { href: "/board/dashboard/suggestions", label: "Suggestions", icon: Users },
    ],
  },
};

export default function DepartmentLayout({
  children,
  department,
}: {
  children: React.ReactNode;
  department: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const config = DEPARTMENT_CONFIGS[department];
  if (!config) {
    return <div className="p-6 text-gray-400">Unknown department: {department}</div>;
  }

  const Icon = config.icon;

  const isActive = (href: string) => {
    if (href === `/department-path/dashboard`) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <Link href={`/${config.slug}/dashboard`} className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center glow-sm flex-shrink-0", config.color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="text-sm font-bold gradient-text leading-tight">{config.name}</h1>
            <p className="text-[10px] text-gray-500">omixsystems</p>
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {config.navItems.map((item) => {
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
                  ? "bg-omix-500/15 text-omix-400 border border-omix-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:border hover:border-white/5"
              )}
            >
              {active && (
                <motion.div
                  layoutId={`${department}-sidebar-active`}
                  className="absolute inset-0 bg-gradient-to-r from-omix-500/10 to-transparent rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <ItemIcon className={cn("w-5 h-5 flex-shrink-0 relative z-10", active && "text-omix-400")} />
              <span className="text-sm font-medium relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href={`/${config.slug}/dashboard/settings`}
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
        {/* Notification bell — fixed top-right in the content area */}
        <div className="absolute top-4 right-4 z-40">
          <div className="glass rounded-xl p-1.5 glow-sm">
            <NotificationBell />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
