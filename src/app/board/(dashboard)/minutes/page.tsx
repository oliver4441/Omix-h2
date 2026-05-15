"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  FileText,
  Calendar,
  Users,
  Download,
  Eye,
  Search,
  AlertCircle,
  Plus,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface MeetingMinute {
  id: string;
  title: string;
  meetingDate: string;
  preparedBy: string;
  approvedBy: string;
  status: "draft" | "approved" | "published";
  keyDecisions: string;
  pages: number;
}

export default function BoardMinutesPage() {
  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMinutes();
  }, []);

  async function fetchMinutes() {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      setMinutes([
        {
          id: "min1",
          title: "Quarterly Board Meeting Q1 2025",
          meetingDate: "2025-04-15",
          preparedBy: "Jane Wanjiku (Secretary)",
          approvedBy: "Dr. Elizabeth Wanjiku",
          status: "published",
          keyDecisions:
            "Approved Q2 budget, established infrastructure committee, resolved staff welfare concerns",
          pages: 12,
        },
        {
          id: "min2",
          title: "Disciplinary Committee Meeting",
          meetingDate: "2025-04-08",
          preparedBy: "Jane Wanjiku (Secretary)",
          approvedBy: "Dr. Elizabeth Wanjiku",
          status: "approved",
          keyDecisions:
            "Revised code of conduct, issued warnings to 3 students, suspended 1 student",
          pages: 8,
        },
        {
          id: "min3",
          title: "Emergency Board Meeting",
          meetingDate: "2025-03-28",
          preparedBy: "Jane Wanjiku (Secretary)",
          approvedBy: "Dr. Elizabeth Wanjiku",
          status: "published",
          keyDecisions:
            "Approved emergency repairs for science lab, allocated KSh 500,000 for safety upgrades",
          pages: 6,
        },
        {
          id: "min4",
          title: "Academic Committee Meeting",
          meetingDate: "2025-03-10",
          preparedBy: "Peter Kamau (Secretary)",
          approvedBy: "Mr. John Kimani",
          status: "draft",
          keyDecisions:
            "Proposed new grading system, recommended remedial classes for weak students",
          pages: 10,
        },
        {
          id: "min5",
          title: "Annual General Meeting 2024",
          meetingDate: "2024-12-10",
          preparedBy: "Jane Wanjiku (Secretary)",
          approvedBy: "Dr. Elizabeth Wanjiku",
          status: "published",
          keyDecisions:
            "Re-elected board members, approved annual report, set fees for 2025",
          pages: 24,
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
      header: "Title",
      sortable: true,
      render: (item: MeetingMinute) => (
        <div>
          <p className="text-sm font-medium text-gray-200">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {item.keyDecisions}
          </p>
        </div>
      ),
    },
    {
      key: "meetingDate",
      header: "Meeting Date",
      sortable: true,
      render: (item: MeetingMinute) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm">{formatDate(item.meetingDate)}</span>
        </div>
      ),
    },
    { key: "preparedBy", header: "Prepared By", sortable: true },
    { key: "approvedBy", header: "Approved By", sortable: true },
    {
      key: "pages",
      header: "Pages",
      sortable: true,
      className: "text-center",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: MeetingMinute) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            item.status === "published"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : item.status === "approved"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          )}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: MeetingMinute) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-omix-400 transition-all">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-omix-400 transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
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
          onClick={fetchMinutes}
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
            Meeting Minutes
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Access and manage board meeting minutes and records
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          New Minutes
        </button>
      </motion.div>

      {/* Minutes Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <DataTable
          columns={columns}
          data={minutes}
          searchable
          searchKeys={["title", "preparedBy", "approvedBy", "keyDecisions"]}
          pageSize={10}
          emptyMessage="No meeting minutes found"
        />
      </motion.div>

      {/* Empty state */}
      {minutes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No Minutes Recorded
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Meeting minutes will appear here once board meetings are held
            and the minutes are uploaded.
          </p>
        </motion.div>
      )}
    </div>
  );
}
