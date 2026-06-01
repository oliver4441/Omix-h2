"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  ArrowUpRight,
  Calendar,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface RecentPayment {
  id: string;
  student: string;
  admissionNo: string;
  amount: number;
  method: string;
  term: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface Defaulter {
  id: string;
  student: string;
  admissionNo: string;
  balance: number;
  term: string;
  daysOverdue: number;
}

export default function BursarDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalCollected: number;
    pendingPayments: number;
    defaulters: number;
    activeStudents: number;
  } | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [defaultersList, setDefaultersList] = useState<Defaulter[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const [statsRes, paymentsRes] = await Promise.all([
        fetch("/api/bursar/stats"),
        fetch("/api/fees"),
      ]);

      if (!statsRes.ok || !paymentsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsData = await statsRes.json();
      const paymentsData = await paymentsRes.json();

      setStats({
        totalCollected: statsData.totalCollected || 0,
        pendingPayments: statsData.pendingPayments || 0,
        defaulters: statsData.defaulters || 0,
        activeStudents: statsData.activeStudents || 0,
      });

      setRecentPayments(
        (statsData.recentPayments || []).map((p: any) => ({
          id: p.id,
          student: p.student?.name || p.studentName || "Unknown",
          admissionNo: p.student?.admissionNo || p.admissionNo || "N/A",
          amount: p.amount || 0,
          method: p.method || "M-Pesa",
          term: p.term || "Current Term",
          date: p.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          status: p.status || "completed",
        }))
      );

      setDefaultersList(
        (statsData.defaultersList || []).map((d: any) => ({
          id: d.id || d.student?.id,
          student: d.student?.name || d.studentName || "Unknown",
          admissionNo: d.student?.admissionNo || d.admissionNo || "N/A",
          balance: d.balance || d.outstanding || 0,
          term: d.term || "Current Term",
          daysOverdue: d.daysOverdue || 0,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const paymentColumns = [
    { key: "student", header: "Student", sortable: true },
    { key: "admissionNo", header: "Admission No", sortable: true },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (item: RecentPayment) => (
        <span className="font-medium text-emerald-400">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    { key: "method", header: "Method", sortable: true },
    { key: "term", header: "Term", sortable: true },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (item: RecentPayment) => formatDate(item.date),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: RecentPayment) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            item.status === "completed"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : item.status === "pending"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          )}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
  ];

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
        <div className="h-64 bg-surface-2 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
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
      >
        <h1 className="text-2xl font-bold gradient-text">Bursar Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Financial overview and fee management
        </p>
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
            title="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            icon={Banknote}
            color="green"
            trend={{ value: 12, positive: true }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={TrendingUp}
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
            title="Defaulters"
            value={stats.defaulters}
            icon={AlertTriangle}
            color="rose"
            trend={{ value: 5, positive: false }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Active Students"
            value={stats.activeStudents}
            icon={Users}
            color="omix"
          />
        </motion.div>
      </motion.div>

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Recent Payments
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-omix-400 hover:text-omix-300 border border-omix-500/20 rounded-xl hover:bg-omix-500/10 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <DataTable
          columns={paymentColumns}
          data={recentPayments}
          searchable
          searchKeys={["student", "admissionNo", "method"]}
          pageSize={5}
          emptyMessage="No payments recorded yet"
        />
      </motion.div>

      {/* Defaulters Section */}
      {defaultersList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-red-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Outstanding Defaulters
                </h2>
                <p className="text-xs text-gray-500">
                  {defaultersList.length} student(s) with overdue balances
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-omix-400 hover:text-omix-300 border border-omix-500/20 rounded-xl hover:bg-omix-500/10 transition-all">
              <Filter className="w-4 h-4" />
              View All
            </button>
          </div>
          <div className="space-y-3">
            {defaultersList.map((defaulter, idx) => (
              <motion.div
                key={defaulter.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-2/50 border border-border hover:bg-surface-2 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {defaulter.student}
                    </p>
                    <p className="text-xs text-gray-500">
                      {defaulter.admissionNo} &middot; {defaulter.term}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-400">
                    {formatCurrency(defaulter.balance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {defaulter.daysOverdue} days overdue
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state for when there's no data */}
      {recentPayments.length === 0 && defaultersList.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No financial data yet
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Payments and fee records will appear here once students start
            making transactions.
          </p>
        </motion.div>
      )}
    </div>
  );
}
