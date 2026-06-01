"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Clock,
  DollarSign,
  UserCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  monthlyFees: { month: string; amount: number }[];
  enrollmentByClass: { name: string; count: number }[];
  recentActivity: { id: string; message: string; time: string; type: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        // Set fallback data for display
        setStats({
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          attendanceRate: 0,
          monthlyFees: [],
          enrollmentByClass: [],
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-omix-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your school performance</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={Users}
            color="omix"
            subtitle="Enrolled students"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title="Total Teachers"
            value={stats?.totalTeachers || 0}
            icon={GraduationCap}
            color="blue"
            subtitle="Active staff"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard
            title="Total Classes"
            value={stats?.totalClasses || 0}
            icon={BookOpen}
            color="amber"
            subtitle="Across all years"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard
            title="Attendance Rate"
            value={`${stats?.attendanceRate || 0}%`}
            icon={UserCheck}
            color="green"
            subtitle="Average today"
          />
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 border border-border"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-omix-400" />
            Fee Collection (Monthly)
          </h2>
          {stats?.monthlyFees && stats.monthlyFees.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.monthlyFees}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12122a",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
              No fee data available
            </div>
          )}
        </motion.div>

        {/* Enrollment by Class */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6 border border-border"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-omix-400" />
            Student Enrollment by Class
          </h2>
          {stats?.enrollmentByClass && stats.enrollmentByClass.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.enrollmentByClass} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#6b7280", fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12122a",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
              No enrollment data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass rounded-2xl p-6 border border-border"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-omix-400" />
          Recent Activity
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, idx) => (
              <motion.div
                key={activity.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="flex items-center gap-4 p-3 rounded-xl bg-surface-2/50 border border-border/50 hover:border-omix-500/20 transition-all"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  activity.type === "payment" ? "bg-emerald-400" :
                  activity.type === "student" ? "bg-omix-400" :
                  activity.type === "teacher" ? "bg-blue-400" :
                  "bg-gray-400"
                )} />
                <p className="text-sm text-gray-300 flex-1">{activity.message}</p>
                <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No recent activity
          </div>
        )}
      </motion.div>
    </div>
  );
}
