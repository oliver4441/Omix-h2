"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  BookMarked,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface BookCheckout {
  id: string;
  book: string;
  author: string;
  borrower: string;
  class: string;
  checkoutDate: string;
  dueDate: string;
  status: "active" | "overdue" | "returned";
}

interface RecentActivity {
  id: string;
  type: "checkout" | "return" | "new_book" | "fine";
  description: string;
  timestamp: string;
}

export default function LibraryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalBooks: number;
    checkedOut: number;
    overdue: number;
    activeMembers: number;
  } | null>(null);
  const [recentCheckouts, setRecentCheckouts] = useState<BookCheckout[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);
  async function fetchDashboard() {
    try {
      setLoading(true);
      const [statsRes, booksRes] = await Promise.all([
        fetch("/api/library/stats"),
        fetch("/api/library/books?limit=5"),
      ]);

      if (!statsRes.ok || !booksRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsData = await statsRes.json();
      const booksData = await booksRes.json();

      setStats({
        totalBooks: statsData.totalBooks || 0,
        checkedOut: statsData.checkedOut || 0,
        overdue: statsData.overdueCount || 0,
        activeMembers: statsData.activeCheckouts || 0,
      });
      setRecentCheckouts([
        {
          id: "1",
          book: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          borrower: "Alice Wanjiku",
          class: "Form 3A",
          checkoutDate: "2025-05-10",
          dueDate: "2025-05-24",
          status: "active",
        },
        {
          id: "2",
          book: "To Kill a Mockingbird",
          author: "Harper Lee",
          borrower: "Brian Kiprop",
          class: "Form 2B",
          checkoutDate: "2025-04-20",
          dueDate: "2025-05-04",
          status: "overdue",
        },
        {
          id: "3",
          book: "1984",
          author: "George Orwell",
          borrower: "Catherine Muthoni",
          class: "Form 4A",
          checkoutDate: "2025-05-12",
          dueDate: "2025-05-26",
          status: "active",
        },
        {
          id: "4",
          book: "Pride and Prejudice",
          author: "Jane Austen",
          borrower: "David Omondi",
          class: "Form 3C",
          checkoutDate: "2025-04-18",
          dueDate: "2025-05-02",
          status: "returned",
        },
        {
          id: "5",
          book: "The Catcher in the Rye",
          author: "J.D. Salinger",
          borrower: "Esther Akinyi",
          class: "Form 2A",
          checkoutDate: "2025-05-08",
          dueDate: "2025-05-22",
          status: "active",
        },
      ]);
      setActivities([
        {
          id: "a1",
          type: "checkout",
          description: '"The Great Gatsby" checked out by Alice Wanjiku',
          timestamp: "2025-05-14T10:30:00",
        },
        {
          id: "a2",
          type: "return",
          description: '"Pride and Prejudice" returned by David Omondi',
          timestamp: "2025-05-14T09:15:00",
        },
        {
          id: "a3",
          type: "new_book",
          description: '10 new science textbooks added to the collection',
          timestamp: "2025-05-13T14:00:00",
        },
        {
          id: "a4",
          type: "fine",
          description: "Fine of KSh 200 collected from Brian Kiprop for overdue book",
          timestamp: "2025-05-13T11:45:00",
        },
        {
          id: "a5",
          type: "checkout",
          description: '"1984" checked out by Catherine Muthoni',
          timestamp: "2025-05-12T15:20:00",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const checkoutColumns = [
    { key: "book", header: "Book", sortable: true },
    { key: "author", header: "Author", sortable: true },
    { key: "borrower", header: "Borrower", sortable: true },
    { key: "class", header: "Class", sortable: true },
    {
      key: "checkoutDate",
      header: "Checked Out",
      sortable: true,
      render: (item: BookCheckout) => formatDate(item.checkoutDate),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      render: (item: BookCheckout) => formatDate(item.dueDate),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: BookCheckout) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            item.status === "active"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : item.status === "overdue"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          )}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
  ];

  const activityIcons: Record<string, React.ReactNode> = {
    checkout: <BookOpen className="w-4 h-4 text-blue-400" />,
    return: <BookMarked className="w-4 h-4 text-emerald-400" />,
    new_book: <Plus className="w-4 h-4 text-omix-400" />,
    fine: <AlertTriangle className="w-4 h-4 text-amber-400" />,
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Library Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage books, checkouts, and library activity
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          Add Book
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
            title="Total Books"
            value={stats.totalBooks.toLocaleString()}
            icon={BookOpen}
            color="omix"
            trend={{ value: 3, positive: true }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Checked Out"
            value={stats.checkedOut}
            icon={BookMarked}
            color="blue"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={Clock}
            color="rose"
            trend={{ value: 8, positive: false }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Active Members"
            value={stats.activeMembers}
            icon={Users}
            color="green"
          />
        </motion.div>
      </motion.div>

      {/* Recent Checkouts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Checkouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Checkouts
            </h2>
            <button className="flex items-center gap-1 text-sm text-omix-400 hover:text-omix-300 transition-colors">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <DataTable
            columns={checkoutColumns}
            data={recentCheckouts}
            searchable
            searchKeys={["book", "author", "borrower"]}
            pageSize={5}
            emptyMessage="No books currently checked out"
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h2>
          <div className="glass rounded-2xl p-6 border-border">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {activityIcons[activity.type] || (
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-snug">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Empty state */}
      {recentCheckouts.length === 0 && activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Welcome to the Library
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Start by adding books to the collection. Checkout and activity
            records will appear here.
          </p>
        </motion.div>
      )}
    </div>
  );
}
