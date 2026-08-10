"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Settings,
  Sparkles,
  Users,
  GraduationCap,
  BookOpen,
  X,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

interface SearchResponse {
  students: SearchResult[];
  teachers: SearchResult[];
  classes: SearchResult[];
}

function renderGroup(
  title: string,
  items: SearchResult[],
  Icon: React.ComponentType<{ className?: string }>
) {
  if (items.length === 0) return null;
  return (
    <div className="py-1">
      <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        {title}
      </p>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
        >
          <Icon className="w-4 h-4 text-omix-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-gray-200 truncate">{item.label}</p>
            <p className="text-[11px] text-gray-500">{item.sublabel}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Header() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced global search across students, teachers and classes
  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, searchOpen]);

  return (
    <header className="sticky top-0 z-20 bg-surface/70 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Global Search */}
        <div className="flex items-center flex-1 max-w-md" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResults(null);
                setSearchOpen(true);
              }}
              placeholder="Search students, teachers, classes..."
              className="w-full pl-10 pr-8 py-2 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {searchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl glow-sm overflow-hidden z-50">
                {searchLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-surface-2 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-1">
                    {renderGroup("Students", searchResults?.students || [], Users)}
                    {renderGroup("Teachers", searchResults?.teachers || [], GraduationCap)}
                    {renderGroup("Classes", searchResults?.classes || [], BookOpen)}
                    {searchResults &&
                      searchResults.students.length === 0 &&
                      searchResults.teachers.length === 0 &&
                      searchResults.classes.length === 0 && (
                        <p className="px-4 py-6 text-center text-xs text-gray-500">
                          No results for &quot;{searchQuery}&quot;
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-omix-500/30 transition-all">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-omix-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* AI Sparkle */}
          <Link
            href="/ai"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-omix-600/20 to-omix-500/10 border border-omix-500/20 text-omix-400 text-sm font-medium hover:from-omix-600/30 hover:to-omix-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assistant</span>
          </Link>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-2 border border-border hover:border-omix-500/30 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-omix-500 to-omix-700 flex items-center justify-center text-white text-xs font-bold">
                {session?.user?.name ? getInitials(session.user.name) : "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-200 leading-tight">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {session?.user?.role || "admin"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-2 w-56 glass rounded-xl glow-sm overflow-hidden"
              >
                <div className="p-2 border-b border-border">
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-200 font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
