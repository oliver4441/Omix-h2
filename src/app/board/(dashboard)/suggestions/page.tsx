"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertCircle,
  ThumbsUp,
  ArrowUpRight,
  Filter,
  Plus,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  role: string;
  date: string;
  category: string;
  status: "new" | "reviewing" | "implemented" | "declined";
  votes: number;
}

export default function BoardSuggestionsPage() {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      setSuggestions([
        {
          id: "s1",
          title: "Install solar panels on admin block",
          description:
            "Proposal to install solar panels on the administration block roof to reduce electricity costs and promote sustainable energy.",
          submittedBy: "Mr. James Kamau",
          role: "Parent",
          date: "2025-05-14",
          category: "Infrastructure",
          status: "new",
          votes: 8,
        },
        {
          id: "s2",
          title: "Introduce coding club for students",
          description:
            "Start a coding and robotics club to equip students with 21st-century digital skills. Would need 15 computers and a volunteer instructor.",
          submittedBy: "Ms. Sarah Atieno",
          role: "Teacher",
          date: "2025-05-13",
          category: "Academics",
          status: "reviewing",
          votes: 15,
        },
        {
          id: "s3",
          title: "Upgrade school library computers",
          description:
            "The library computers are outdated. Proposal to replace 10 desktops with modern machines for student research.",
          submittedBy: "Mrs. Grace Muthoni",
          role: "Parent",
          date: "2025-05-12",
          category: "Infrastructure",
          status: "new",
          votes: 12,
        },
        {
          id: "s4",
          title: "Organize annual career day event",
          description:
            "Host a career day with alumni and professionals from various fields to guide students in career choices.",
          submittedBy: "Brian Kiprop",
          role: "Student",
          date: "2025-05-11",
          category: "Events",
          status: "implemented",
          votes: 22,
        },
        {
          id: "s5",
          title: "Install more water fountains",
          description:
            "Add 3 more water fountains around the school compound for easier access to clean drinking water.",
          submittedBy: "Mr. Peter Ochieng",
          role: "Parent",
          date: "2025-05-10",
          category: "Infrastructure",
          status: "declined",
          votes: 3,
        },
        {
          id: "s6",
          title: "Introduce swimming as a sport",
          description:
            "Proposal to introduce swimming as an extracurricular sport. Would require building a school pool.",
          submittedBy: "Esther Akinyi",
          role: "Student",
          date: "2025-05-09",
          category: "Sports",
          status: "reviewing",
          votes: 18,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "title",
      header: "Suggestion",
      sortable: true,
      render: (item: Suggestion) => (
        <div>
          <p className="text-sm font-medium text-gray-200">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {item.description}
          </p>
        </div>
      ),
    },
    {
      key: "submittedBy",
      header: "Submitted By",
      sortable: true,
      render: (item: Suggestion) => (
        <div>
          <p className="text-sm text-gray-300">{item.submittedBy}</p>
          <p className="text-xs text-gray-500">{item.role}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (item: Suggestion) => (
        <span className="text-sm text-gray-300">{formatDate(item.date)}</span>
      ),
    },
    { key: "category", header: "Category", sortable: true },
    {
      key: "votes",
      header: "Votes",
      sortable: true,
      className: "text-center",
      render: (item: Suggestion) => (
        <div className="flex items-center justify-center gap-1">
          <ThumbsUp className="w-3.5 h-3.5 text-omix-400" />
          <span className="text-sm font-medium">{item.votes}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: Suggestion) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            item.status === "new"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : item.status === "reviewing"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : item.status === "implemented"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
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
        <div className="h-64 bg-surface-2 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchSuggestions}
          className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

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
            Suggestions
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and manage suggestions from parents, teachers, and students
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          Add Suggestion
        </button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 border border-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {suggestions.filter((s) => s.status === "new").length}
              </p>
              <p className="text-xs text-gray-500">New</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {suggestions.filter((s) => s.status === "reviewing").length}
              </p>
              <p className="text-xs text-gray-500">Reviewing</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {suggestions.filter((s) => s.status === "implemented").length}
              </p>
              <p className="text-xs text-gray-500">Implemented</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {suggestions.filter((s) => s.status === "declined").length}
              </p>
              <p className="text-xs text-gray-500">Declined</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <DataTable
          columns={columns}
          data={suggestions}
          searchable
          searchKeys={[
            "title",
            "description",
            "submittedBy",
            "category",
            "role",
          ]}
          pageSize={10}
          emptyMessage="No suggestions submitted yet"
        />
      </motion.div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No Suggestions Yet
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Suggestions from parents, teachers, and students will appear here
            for review and action by the board.
          </p>
        </motion.div>
      )}
    </div>
  );
}
