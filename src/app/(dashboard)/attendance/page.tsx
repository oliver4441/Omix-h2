"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Loader2,
  Download,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";

interface ClassOption {
  id: string;
  name: string;
  code: string;
}

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
}

interface AttendanceRecord {
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string | null;
}

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "present", label: "Present", icon: CheckCircle2, color: "emerald" },
  { value: "absent", label: "Absent", icon: XCircle, color: "red" },
  { value: "late", label: "Late", icon: Clock, color: "amber" },
  { value: "excused", label: "Excused", icon: HelpCircle, color: "blue" },
];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  absent: "bg-red-500/10 text-red-400 border-red-500/20",
  late: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  excused: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const STATUS_BTN_COLORS: Record<AttendanceStatus, string> = {
  present:
    "data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:border-emerald-500 border-emerald-500/30 text-emerald-400",
  absent:
    "data-[active=true]:bg-red-500 data-[active=true]:text-white data-[active=true]:border-red-500 border-red-500/30 text-red-400",
  late:
    "data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500 border-amber-500/30 text-amber-400",
  excused:
    "data-[active=true]:bg-blue-500 data-[active=true]:text-white data-[active=true]:border-blue-500 border-blue-500/30 text-blue-400",
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [existingRecords, setExistingRecords] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/classes?limit=200")
      .then((r) => r.json())
      .then((data) => setClasses(data.classes))
      .catch(() => {});
  }, []);

  // Load students when class or date changes
  useEffect(() => {
    if (!selectedClass || !date) return;
    loadStudents();
  }, [selectedClass, date]);

  async function loadStudents() {
    try {
      setStudentsLoading(true);
      setError("");

      // Fetch students enrolled in this class
      const studentsRes = await fetch(`/api/students?classId=${selectedClass}`);
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsRes.json();
      setStudents(studentsData.students || []);

      // Fetch existing attendance for this class + date
      const attRes = await fetch(
        `/api/attendance?classId=${selectedClass}&date=${date}`
      );
      if (attRes.ok) {
        const attData = await attRes.json();
        const records: Record<string, AttendanceStatus> = {};
        // /api/attendance returns the list under `attendance`
        (attData.attendance || []).forEach(
          (r: { studentId: string; status: AttendanceStatus }) => {
            records[r.studentId] = r.status;
          }
        );
        setExistingRecords(records);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setStudentsLoading(false);
    }
  }

  function getStatus(studentId: string): AttendanceStatus {
    return existingRecords[studentId] || "present";
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setExistingRecords((prev) => ({ ...prev, [studentId]: status }));
  }

  async function handleSubmit() {
    if (!selectedClass || !date) {
      setError("Please select a class and date");
      return;
    }
    if (students.length === 0) {
      setError("No students to record attendance for");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const records: AttendanceRecord[] = students.map((student) => ({
        studentId: student.id,
        classId: selectedClass,
        date,
        status: getStatus(student.id),
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save attendance");
      }

      setSuccess(
        `Attendance saved for ${students.length} students on ${formatDate(date)}`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Calculate attendance rate for display
  const totalRecords = students.length;
  const presentCount = students.filter(
    (s) => getStatus(s.id) === "present"
  ).length;
  const attendanceRate =
    totalRecords > 0
      ? Math.round((presentCount / totalRecords) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Attendance</h1>
        <p className="text-gray-400 text-sm mt-1">
          Record and manage student attendance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Students"
          value={totalRecords}
          icon={Users}
          color="omix"
        />
        <StatCard
          title="Present Today"
          value={presentCount}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={ClipboardCheck}
          color="amber"
        />
      </div>

      {/* Controls */}
      <div className="glass rounded-2xl p-5 border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
            />
          </div>

          <div className="flex items-end gap-3 w-full md:w-auto">
            <a
              href={`/api/export?entity=attendance${selectedClass ? `&classId=${selectedClass}` : ""}${date ? `&date=${date}` : ""}`}
              title="Export attendance to CSV"
              className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 hover:text-gray-200 hover:border-omix-500/30 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </a>
            <button
              onClick={loadStudents}
              disabled={!selectedClass || studentsLoading}
              className="px-5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 hover:text-gray-200 hover:bg-surface-3 disabled:opacity-40 transition-all"
            >
              {studentsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || students.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </p>
        </div>
      )}
      {error && (
        <div className="glass rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Attendance Table */}
      <div className="glass rounded-2xl overflow-hidden border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Student Attendance
          </h2>
          <div className="flex items-center gap-3">
            {STATUS_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center gap-1.5 text-xs text-gray-500"
              >
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    STATUS_COLORS[opt.value].split(" ")[0]
                  )}
                />
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        {!selectedClass ? (
          <div className="px-6 py-16 text-center">
            <CalendarDays className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Select a class and date to start recording attendance
            </p>
          </div>
        ) : studentsLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-surface-2 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No students found in this class
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student, idx) => {
                  const currentStatus = getStatus(student.id);
                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-omix-400">
                          {student.admissionNo}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-200 font-medium">
                          {student.firstName} {student.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-400 capitalize">
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {STATUS_OPTIONS.map((opt) => {
                            const isActive = currentStatus === opt.value;
                            return (
                              <button
                                key={opt.value}
                                data-active={isActive}
                                onClick={() =>
                                  setStatus(student.id, opt.value)
                                }
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                                  "hover:scale-105",
                                  isActive
                                    ? STATUS_BTN_COLORS[opt.value]
                                    : "border-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
                                )}
                                title={opt.label}
                              >
                                <opt.icon className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {students.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {students.length} students
            </span>
            <span className="text-sm text-gray-400">
              Present:{" "}
              <span className="text-emerald-400 font-medium">
                {presentCount}
              </span>{" "}
              &middot; Absent:{" "}
              <span className="text-red-400 font-medium">
                {students.filter((s) => getStatus(s.id) === "absent").length}
              </span>{" "}
              &middot; Late:{" "}
              <span className="text-amber-400 font-medium">
                {students.filter((s) => getStatus(s.id) === "late").length}
              </span>{" "}
              &middot; Excused:{" "}
              <span className="text-blue-400 font-medium">
                {students.filter((s) => getStatus(s.id) === "excused").length}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
