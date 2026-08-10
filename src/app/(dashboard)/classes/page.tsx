"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, BookOpen, Users, GraduationCap, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassData {
  id: string;
  name: string;
  code: string;
  academicYear: string;
  capacity: number | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string;
  } | null;
  _count: { enrollments: number };
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      setLoading(true);
      const res = await fetch("/api/classes?limit=200");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="h-6 w-24 bg-surface-2 rounded-lg mb-4" />
              <div className="h-4 w-32 bg-surface-2 rounded-lg mb-3" />
              <div className="h-3 w-full bg-surface-2 rounded-full mb-2" />
              <div className="h-4 w-20 bg-surface-2 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Classes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage classes, timetables, and student rosters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export?entity=classes"
            title="Export classes to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border hover:border-omix-500/30 text-gray-300 font-medium rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </a>
          <button
            onClick={() => router.push("/classes/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Class Cards Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {classes.length === 0 ? (
          <div className="col-span-full glass rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No classes found</p>
            <button
              onClick={() => router.push("/classes/new")}
              className="mt-4 px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all text-sm"
            >
              Create your first class
            </button>
          </div>
        ) : (
          classes.map((cls) => {
            const enrollmentPercent = cls.capacity
              ? Math.min(100, Math.round((cls._count.enrollments / cls.capacity) * 100))
              : 0;
            const isFull = cls.capacity ? cls._count.enrollments >= cls.capacity : false;

            return (
              <motion.div
                key={cls.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                onClick={() => router.push(`/classes/${cls.id}`)}
                className="glass rounded-2xl p-6 border-border glass-hover cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-omix-500/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-omix-400" />
                  </div>
                  <span className="text-xs font-mono text-omix-400 bg-omix-500/10 px-2.5 py-1 rounded-lg">
                    {cls.code}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">
                  {cls.name}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{cls.academicYear}</p>

                {/* Teacher */}
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">
                    {cls.teacher
                      ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
                      : "No teacher assigned"}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {cls._count.enrollments}
                        {cls.capacity ? ` / ${cls.capacity}` : ""} students
                      </span>
                      {cls.capacity && (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isFull ? "text-red-400" : "text-emerald-400"
                          )}
                        >
                          {enrollmentPercent}%
                        </span>
                      )}
                    </div>
                    {cls.capacity && (
                      <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${enrollmentPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            isFull
                              ? "bg-gradient-to-r from-red-500 to-red-400"
                              : enrollmentPercent > 75
                              ? "bg-gradient-to-r from-amber-500 to-amber-400"
                              : "bg-gradient-to-r from-omix-500 to-omix-400"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
