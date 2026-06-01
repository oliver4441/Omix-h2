"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface BoardMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  chairperson: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  attendeeCount: number;
  agenda: string;
}

export default function BoardMeetingsPage() {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<BoardMeeting[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      setMeetings([
        {
          id: "m1",
          title: "Annual Budget Review",
          date: "2025-05-20",
          time: "09:00 AM",
          venue: "Board Room",
          chairperson: "Dr. Elizabeth Wanjiku",
          status: "scheduled",
          attendeeCount: 11,
          agenda: "Review FY2025/26 budget, approve expenditure plans",
        },
        {
          id: "m2",
          title: "Infrastructure Development Committee",
          date: "2025-05-22",
          time: "02:00 PM",
          venue: "Conference Hall",
          chairperson: "Mr. John Kimani",
          status: "scheduled",
          attendeeCount: 6,
          agenda: "New classroom block proposal, lab renovation update",
        },
        {
          id: "m3",
          title: "Academic Performance Review",
          date: "2025-05-25",
          time: "10:00 AM",
          venue: "Board Room",
          chairperson: "Dr. Elizabeth Wanjiku",
          status: "scheduled",
          attendeeCount: 9,
          agenda: "Term 1 results analysis, improvement strategies",
        },
        {
          id: "m4",
          title: "Quarterly Board Meeting Q1 2025",
          date: "2025-04-15",
          time: "09:00 AM",
          venue: "Board Room",
          chairperson: "Dr. Elizabeth Wanjiku",
          status: "completed",
          attendeeCount: 10,
          agenda: "Q1 performance, financial reports, strategic planning",
        },
        {
          id: "m5",
          title: "Disciplinary Committee",
          date: "2025-04-08",
          time: "11:00 AM",
          venue: "Principal's Office",
          chairperson: "Mr. Peter Ochieng",
          status: "completed",
          attendeeCount: 5,
          agenda: "Student conduct review, policy amendments",
        },
        {
          id: "m6",
          title: "Emergency Board Meeting",
          date: "2025-03-28",
          time: "02:00 PM",
          venue: "Board Room",
          chairperson: "Dr. Elizabeth Wanjiku",
          status: "completed",
          attendeeCount: 9,
          agenda: "Urgent infrastructure safety concerns",
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
      header: "Meeting",
      sortable: true,
      render: (item: BoardMeeting) => (
        <div>
          <p className="text-sm font-medium text-gray-200">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.agenda}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (item: BoardMeeting) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm">{formatDate(item.date)}</span>
        </div>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (item: BoardMeeting) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm text-gray-300">{item.time}</span>
        </div>
      ),
    },
    {
      key: "venue",
      header: "Venue",
      render: (item: BoardMeeting) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm text-gray-300">{item.venue}</span>
        </div>
      ),
    },
    {
      key: "chairperson",
      header: "Chairperson",
      sortable: true,
    },
    {
      key: "attendeeCount",
      header: "Attendees",
      sortable: true,
      className: "text-center",
      render: (item: BoardMeeting) => (
        <div className="flex items-center justify-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm">{item.attendeeCount}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: BoardMeeting) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            item.status === "scheduled"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : item.status === "ongoing"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : item.status === "completed"
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
          onClick={fetchMeetings}
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
          <h1 className="text-2xl font-bold gradient-text">Board Meetings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Schedule and manage board of management meetings
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </motion.div>

      {/* Meetings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <DataTable
          columns={columns}
          data={meetings}
          searchable
          searchKeys={["title", "chairperson", "venue", "agenda"]}
          pageSize={10}
          emptyMessage="No meetings scheduled yet"
        />
      </motion.div>

      {/* Empty state */}
      {meetings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No Board Meetings
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Schedule the first board meeting to start tracking attendance,
            agendas, and minutes.
          </p>
        </motion.div>
      )}
    </div>
  );
}
