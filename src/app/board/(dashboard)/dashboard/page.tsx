"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Calendar,
  ClipboardList,
  Users,
  Lightbulb,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  MessageSquare,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  status: "scheduled" | "ongoing" | "completed";
  attendeeCount: number;
}

interface Suggestion {
  id: string;
  title: string;
  submittedBy: string;
  date: string;
  status: "new" | "reviewing" | "implemented" | "declined";
  category: string;
}

export default function BoardDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    upcomingMeetings: number;
    totalMinutes: number;
    newSuggestions: number;
    boardMembers: number;
  } | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentSuggestions, setRecentSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setStats({
        upcomingMeetings: 3,
        totalMinutes: 24,
        newSuggestions: 8,
        boardMembers: 11,
      });
      setUpcomingMeetings([
        {
          id: "m1",
          title: "Annual Budget Review",
          date: "2025-05-20",
          time: "09:00 AM",
          status: "scheduled",
          attendeeCount: 11,
        },
        {
          id: "m2",
          title: "Infrastructure Development Committee",
          date: "2025-05-22",
          time: "02:00 PM",
          status: "scheduled",
          attendeeCount: 6,
        },
        {
          id: "m3",
          title: "Academic Performance Review",
          date: "2025-05-25",
          time: "10:00 AM",
          status: "scheduled",
          attendeeCount: 9,
        },
      ]);
      setRecentSuggestions([
        {
          id: "s1",
          title: "Install solar panels on admin block",
          submittedBy: "Parent - Mr. Kamau",
          date: "2025-05-14",
          status: "new",
          category: "Infrastructure",
        },
        {
          id: "s2",
          title: "Introduce coding club for students",
          submittedBy: "Teacher - Ms. Atieno",
          date: "2025-05-13",
          status: "reviewing",
          category: "Academics",
        },
        {
          id: "s3",
          title: "Upgrade school library computers",
          submittedBy: "Parent - Mrs. Muthoni",
          date: "2025-05-12",
          status: "new",
          category: "Infrastructure",
        },
        {
          id: "s4",
          title: "Organize career day event",
          submittedBy: "Student - Brian Kiprop",
          date: "2025-05-11",
          status: "implemented",
          category: "Events",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (
    status: Meeting["status"] | Suggestion["status"]
  ) => {
    if (status === "scheduled" || status === "new")
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (status === "ongoing" || status === "reviewing")
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    if (status === "completed" || status === "implemented")
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (status === "declined")
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-surface-2 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-12 w-12 bg-surface-2 rounded-xl mb-4" />
              <div className="h-8 w-24 bg-surface-2 rounded-lg mb-2" />
              <div className="h-4 w-32 bg-surface-2 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-2 rounded-2xl animate-pulse" />
          <div className="h-64 bg-surface-2 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Board of Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Meetings, minutes, and suggestions overview
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Upcoming Meetings"
            value={stats.upcomingMeetings}
            icon={Calendar}
            color="omix"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Meeting Minutes"
            value={stats.totalMinutes}
            icon={ClipboardList}
            color="blue"
            trend={{ value: 4, positive: true }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="New Suggestions"
            value={stats.newSuggestions}
            icon={Lightbulb}
            color="amber"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Board Members"
            value={stats.boardMembers}
            icon={Users}
            color="green"
          />
        </motion.div>
      </motion.div>

      {/* Upcoming Meetings & Recent Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Upcoming Meetings
            </h2>
            <a
              href="/board/dashboard/meetings"
              className="flex items-center gap-1 text-sm text-omix-400 hover:text-omix-300 transition-colors"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="glass rounded-2xl p-6 border-border">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No upcoming meetings scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting, idx) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-surface-2/50 border border-border hover:bg-surface-2 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-omix-500/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-omix-400 leading-none">
                        {new Date(meeting.date).getDate()}
                      </span>
                      <span className="text-[10px] text-omix-400 uppercase">
                        {new Date(meeting.date).toLocaleDateString("en-KE", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-200">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{meeting.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{meeting.attendeeCount} attendees</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                        statusBadge(meeting.status)
                      )}
                    >
                      {meeting.status.charAt(0).toUpperCase() +
                        meeting.status.slice(1)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Suggestions
            </h2>
            <a
              href="/board/dashboard/suggestions"
              className="flex items-center gap-1 text-sm text-omix-400 hover:text-omix-300 transition-colors"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="glass rounded-2xl p-6 border-border">
            {recentSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No suggestions submitted yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSuggestions.map((suggestion, idx) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-surface-2/50 border border-border hover:bg-surface-2 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-200">
                        {suggestion.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {suggestion.submittedBy} &middot;{" "}
                        {formatDate(suggestion.date)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-500 bg-surface-2 px-2 py-0.5 rounded-full border border-border">
                          {suggestion.category}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            statusBadge(suggestion.status)
                          )}
                        >
                          {suggestion.status.charAt(0).toUpperCase() +
                            suggestion.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Empty state */}
      {upcomingMeetings.length === 0 && recentSuggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Welcome to the Board Portal
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Schedule your first meeting and start tracking board activities,
            minutes, and suggestions from stakeholders.
          </p>
        </motion.div>
      )}
    </div>
  );
}
