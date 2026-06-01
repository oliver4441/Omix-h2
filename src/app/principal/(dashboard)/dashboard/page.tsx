"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookOpen,
  Banknote,
  Library,
  FlaskConical,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Building2,
  Monitor,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "@/components/ui/StatCard";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
export const dynamic = 'force-dynamic';

interface OverviewData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  feeSummary: {
    totalCollected: number;
    pendingCount: number;
  };
  librarySummary: {
    totalBooks: number;
    booksCheckedOut: number;
    availableBooks: number;
  };
  labSummary: {
    totalApparatus: number;
    brokenCount: number;
    lostCount: number;
  };
  recentLogs: {
    id: string;
    department: string;
    action: string;
    description: string;
    userId: string | null;
    user: { id: string; name: string; email: string } | null;
    metadata: string | null;
    createdAt: string;
  }[];
  performanceSummary: {
    classes: {
      classId: string;
      className: string;
      subjects: { subjectId: string; meanScore: number | null }[];
      overallMean: number;
    }[];
  };
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  feeCollectionByMonth: { month: string; year: string; total: number }[];
  studentEnrollmentByClass: { id: string; name: string; code: string; studentCount: number }[];
}

const DEPARTMENT_QUICK_LINKS = [
  { href: "/bursar/dashboard", label: "Bursar", icon: Banknote, color: "from-emerald-500 to-emerald-700", desc: "Fee collection & finances" },
  { href: "/library/dashboard", label: "Library", icon: Library, color: "from-amber-500 to-amber-700", desc: "Books & checkouts" },
  { href: "/science-lab/dashboard", label: "Science Lab", icon: FlaskConical, color: "from-cyan-500 to-cyan-700", desc: "Apparatus & experiments" },
  { href: "/computer-lab/dashboard", label: "Computer Lab", icon: Monitor, color: "from-purple-500 to-purple-700", desc: "Computers & students" },
  { href: "/board/dashboard", label: "Board", icon: Building2, color: "from-blue-500 to-blue-700", desc: "Meetings & governance" },
];

const DEPT_COLORS: Record<string, string> = {
  bursar: "emerald",
  library: "amber",
  "science-lab": "cyan",
  "computer-lab": "purple",
  board: "blue",
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function getDepartmentLabel(dept: string): string {
  const map: Record<string, string> = {
    bursar: "Bursar",
    library: "Library",
    "science-lab": "Science Lab",
    "computer-lab": "Computer Lab",
    board: "Board",
  };
  return map[dept] || dept;
}

function getDepartmentIcon(dept: string) {
  const map: Record<string, React.ElementType> = {
    bursar: Banknote,
    library: Library,
    "science-lab": FlaskConical,
    "computer-lab": Monitor,
    board: Building2,
  };
  return map[dept] || Activity;
}

export default function PrincipalDashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiSummary, setAiSummary] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [overviewRes, statsRes] = await Promise.all([
        fetch("/api/principal/overview"),
        fetch("/api/dashboard/stats"),
      ]);

      if (!overviewRes.ok) throw new Error("Failed to fetch overview");
      if (!statsRes.ok) throw new Error("Failed to fetch dashboard stats");

      const overviewData = await overviewRes.json();
      const statsData = await statsRes.json();

      setOverview(overviewData);
      setDashboardStats(statsData);

      // Generate a simple AI summary from the data
      generateSummary(overviewData, statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function generateSummary(ov: OverviewData, ds: DashboardStats) {
    const parts: string[] = [];

    parts.push(`**School at a Glance:** ${ov.totalStudents} active students, ${ov.totalTeachers} teachers, ${ov.totalClasses} classes.`);

    if (ds.attendanceRate > 0) {
      parts.push(`Attendance rate is at **${ds.attendanceRate}%**.`);
    }

    const collected = ov.feeSummary.totalCollected;
    if (collected > 0) {
      parts.push(`Fee collections total **${formatCurrency(collected)}** with **${ov.feeSummary.pendingCount}** students pending payment.`);
    }

    if (ov.librarySummary.totalBooks > 0) {
      const avail = ov.librarySummary.availableBooks;
      const total = ov.librarySummary.totalBooks;
      parts.push(`Library has **${total}** books (${avail} available, ${ov.librarySummary.booksCheckedOut} checked out).`);
    }

    if (ov.labSummary.totalApparatus > 0) {
      const health = Math.round(((ov.labSummary.totalApparatus - ov.labSummary.brokenCount - ov.labSummary.lostCount) / ov.labSummary.totalApparatus) * 100);
      parts.push(`Science lab apparatus health is at **${health}%** (${ov.labSummary.brokenCount} broken, ${ov.labSummary.lostCount} lost).`);
    }

    if (ov.performanceSummary.classes.length > 0) {
      const avgPerformance = ov.performanceSummary.classes.reduce((sum, c) => sum + c.overallMean, 0) / ov.performanceSummary.classes.length;
      parts.push(`Mean academic performance across classes: **${avgPerformance.toFixed(1)}%**.`);
    }

    if (ov.recentLogs.length > 0) {
      parts.push(`**${ov.recentLogs.length}** recent activities logged across departments.`);
    }

    setAiSummary(parts.join("\n\n") || "All systems operational. No significant data to report.");
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-surface-2 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-12 w-12 bg-surface-2 rounded-xl mb-4" />
              <div className="h-8 w-24 bg-surface-2 rounded-lg mb-2" />
              <div className="h-4 w-32 bg-surface-2 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-surface-2 rounded-2xl animate-pulse" />
          <div className="h-80 bg-surface-2 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">Principal&apos;s dashboard</p>
        </div>
        <div className="glass rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview || !dashboardStats) return null;

  const labHealth = overview.labSummary.totalApparatus > 0
    ? Math.round(((overview.labSummary.totalApparatus - overview.labSummary.brokenCount - overview.labSummary.lostCount) / overview.labSummary.totalApparatus) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold gradient-text">Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">
            Principal&apos;s overview — {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm text-omix-400 hover:text-omix-300 border border-omix-500/20 rounded-xl hover:bg-omix-500/10 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Total Students" value={overview.totalStudents} icon={Users} color="omix" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Total Teachers" value={overview.totalTeachers} icon={GraduationCap} color="blue" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Total Collected" value={formatCurrency(overview.feeSummary.totalCollected)} icon={Banknote} color="green" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Active Classes" value={overview.totalClasses} icon={BookOpen} color="amber" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Books Loaned" value={overview.librarySummary.booksCheckedOut} icon={Library} color="blue" subtitle={`${overview.librarySummary.availableBooks} available`} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Apparatus Health" value={`${labHealth}%`} icon={FlaskConical} color={labHealth > 80 ? "green" : labHealth > 50 ? "amber" : "rose"} subtitle={`${overview.labSummary.brokenCount} broken`} />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border-border"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Fee Collection Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly collection amounts</p>
          {dashboardStats.feeCollectionByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboardStats.feeCollectionByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#e5e7eb",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Collected"]}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
              No fee collection data available
            </div>
          )}
        </motion.div>

        {/* Attendance Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border-border"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Attendance Rate</h3>
          <p className="text-xs text-gray-500 mb-4">Overall attendance percentage</p>
          <div className="flex items-center justify-center h-[250px]">
            <div className="relative">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="8"
                  strokeDasharray={`${(dashboardStats.attendanceRate / 100) * 339.292} 339.292`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{dashboardStats.attendanceRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Attendance</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Summary Card */}
      {aiSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 border border-indigo-500/10 bg-gradient-to-r from-indigo-500/5 to-transparent"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-omix-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-omix-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-2">AI Summary</h3>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {aiSummary}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Links to Departments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DEPARTMENT_QUICK_LINKS.map((dept, idx) => {
            const DeptIcon = dept.icon;
            return (
              <Link
                key={dept.href}
                href={dept.href}
                className="glass rounded-xl p-4 border-border hover:glow-sm transition-all duration-300 group"
              >
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", dept.color)}>
                  <DeptIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-omix-400 transition-colors">
                  {dept.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{dept.desc}</p>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass rounded-2xl p-6 border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            <p className="text-xs text-gray-500">Latest actions from all departments</p>
          </div>
        </div>

        {overview.recentLogs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent activity logged</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {overview.recentLogs.map((log, idx) => {
              const DeptIcon = getDepartmentIcon(log.department);
              const deptColor = DEPT_COLORS[log.department] || "gray";
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface-2/30 border border-border hover:bg-surface-2/50 transition-all"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", `bg-${deptColor}-500/10`)}>
                    <DeptIcon className={cn("w-4 h-4", `text-${deptColor}-400`)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {getDepartmentLabel(log.department)}
                      </span>
                      <span className="text-xs text-gray-400">&middot;</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 mt-0.5">{log.description}</p>
                    {log.user && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        by {log.user.name}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Performance Summary */}
      {overview.performanceSummary.classes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 border-border"
        >
          <h3 className="text-sm font-semibold text-white mb-1">
            Academic Performance
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Mean scores by class (latest assessments)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.performanceSummary.classes.slice(0, 9).map((cls, idx) => (
              <div
                key={cls.classId}
                className="glass rounded-xl p-4 border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-200">
                    {cls.className}
                  </h4>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      cls.overallMean >= 70
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : cls.overallMean >= 50
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}
                  >
                    {cls.overallMean}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {cls.subjects.length} subject(s)
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Enrollment by Class */}
      {dashboardStats.studentEnrollmentByClass.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass rounded-2xl p-6 border-border"
        >
          <h3 className="text-sm font-semibold text-white mb-1">
            Enrollment by Class
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Student distribution across classes
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardStats.studentEnrollmentByClass} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#e5e7eb",
                }}
              />
              <Bar dataKey="studentCount" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
