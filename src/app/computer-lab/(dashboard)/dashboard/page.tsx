"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Users,
  Clock,
  AlertTriangle,
  Power,
  PowerOff,
  Wifi,
  HardDrive,
  ArrowUpRight,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface ComputerStation {
  id: string;
  name: string;
  ipAddress: string;
  status: "online" | "offline" | "maintenance";
  assignedTo: string;
  lastActive: string;
  specs: string;
}

interface LabSession {
  id: string;
  class: string;
  teacher: string;
  subject: string;
  startTime: string;
  endTime: string;
  studentsPresent: number;
}

export default function ComputerLabDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalComputers: number;
    online: number;
    inUse: number;
    totalStudents: number;
  } | null>(null);
  const [stations, setStations] = useState<ComputerStation[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setStats({
        totalComputers: 48,
        online: 42,
        inUse: 28,
        totalStudents: 420,
      });
      setStations([
        {
          id: "c1",
          name: "Lab-1-01",
          ipAddress: "192.168.1.101",
          status: "online",
          assignedTo: "Form 3A - James Kamau",
          lastActive: "2025-05-14T10:30:00",
          specs: "Intel i5, 8GB RAM, SSD",
        },
        {
          id: "c2",
          name: "Lab-1-02",
          ipAddress: "192.168.1.102",
          status: "offline",
          assignedTo: "Unassigned",
          lastActive: "2025-05-12T14:00:00",
          specs: "Intel i5, 8GB RAM, SSD",
        },
        {
          id: "c3",
          name: "Lab-1-03",
          ipAddress: "192.168.1.103",
          status: "maintenance",
          assignedTo: "Unassigned",
          lastActive: "2025-05-10T09:00:00",
          specs: "Intel i5, 8GB RAM, HDD",
        },
        {
          id: "c4",
          name: "Lab-1-04",
          ipAddress: "192.168.1.104",
          status: "online",
          assignedTo: "Form 2B - Mary Wanjiku",
          lastActive: "2025-05-14T10:15:00",
          specs: "Intel i7, 16GB RAM, SSD",
        },
        {
          id: "c5",
          name: "Lab-1-05",
          ipAddress: "192.168.1.105",
          status: "online",
          assignedTo: "Form 4A - Peter Ochieng",
          lastActive: "2025-05-14T10:00:00",
          specs: "Intel i5, 8GB RAM, SSD",
        },
      ]);
      setSessions([
        {
          id: "s1",
          class: "Form 3A",
          teacher: "Mr. Kimani",
          subject: "Computer Science",
          startTime: "2025-05-14T08:00:00",
          endTime: "2025-05-14T09:30:00",
          studentsPresent: 28,
        },
        {
          id: "s2",
          class: "Form 2B",
          teacher: "Ms. Atieno",
          subject: "ICT",
          startTime: "2025-05-14T10:00:00",
          endTime: "2025-05-14T11:30:00",
          studentsPresent: 32,
        },
        {
          id: "s3",
          class: "Form 4A",
          teacher: "Mr. Kimani",
          subject: "Computer Science",
          startTime: "2025-05-14T12:00:00",
          endTime: "2025-05-14T13:30:00",
          studentsPresent: 25,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const stationColumns = [
    { key: "name", header: "Station", sortable: true },
    { key: "ipAddress", header: "IP Address", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: ComputerStation) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              item.status === "online"
                ? "bg-emerald-400"
                : item.status === "offline"
                ? "bg-gray-500"
                : "bg-amber-400"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              item.status === "online"
                ? "text-emerald-400"
                : item.status === "offline"
                ? "text-gray-500"
                : "text-amber-400"
            )}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </div>
      ),
    },
    { key: "assignedTo", header: "Assigned To", sortable: true },
    { key: "specs", header: "Specifications" },
  ];

  const statusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Power className="w-4 h-4 text-emerald-400" />;
      case "offline":
        return <PowerOff className="w-4 h-4 text-gray-500" />;
      case "maintenance":
        return <WrenchIcon className="w-4 h-4 text-amber-400" />;
      default:
        return <Monitor className="w-4 h-4 text-gray-400" />;
    }
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
            Computer Lab Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor lab stations, schedules, and usage
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          Add Station
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
            title="Total Computers"
            value={stats.totalComputers}
            icon={Monitor}
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
            title="Online"
            value={stats.online}
            icon={Wifi}
            color="green"
            trend={{
              value: Math.round((stats.online / stats.totalComputers) * 100),
              positive: true,
            }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Currently In Use"
            value={stats.inUse}
            icon={HardDrive}
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
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            color="amber"
          />
        </motion.div>
      </motion.div>

      {/* Today's Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Today&apos;s Lab Sessions
        </h2>
        {sessions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No sessions scheduled for today
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass rounded-2xl p-5 border-border hover:glow transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-omix-400 bg-omix-500/10 px-2.5 py-1 rounded-full border border-omix-500/20">
                    {session.subject}
                  </span>
                  <span className="text-xs text-gray-500">
                    {session.studentsPresent} students
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {session.class}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {session.teacher}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(session.startTime).toLocaleTimeString("en-KE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(session.endTime).toLocaleTimeString("en-KE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Computer Stations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Lab Stations
          </h2>
          <button className="flex items-center gap-1 text-sm text-omix-400 hover:text-omix-300 transition-colors">
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <DataTable
          columns={stationColumns}
          data={stations}
          searchable
          searchKeys={["name", "ipAddress", "assignedTo"]}
          pageSize={5}
          emptyMessage="No computer stations registered"
        />
      </motion.div>

      {/* Empty state */}
      {stations.length === 0 && sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Computer Lab Not Set Up
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Register computer stations and schedule lab sessions to start
            tracking usage.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// WrenchIcon used above in statusIcon
function WrenchIcon({ className }: { className?: string }) {
  // Simple inline to avoid extra import — it's already used via lucide-react
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
