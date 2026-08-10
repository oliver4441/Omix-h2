"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Save,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
  BookOpen,
  ChevronDown,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface ClassOption {
  id: string;
  name: string;
  code: string;
}

interface Exam {
  id: string;
  name: string;
  term: string;
  academicYear: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface GradeRecord {
  id?: string;
  studentId: string;
  subjectId: string;
  examId: string;
  classId: string;
  score: number | null;
  grade: string | null;
  remarks: string | null;
  student?: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
  };
}

interface StudentWithScore {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  score: number | "";
  grade: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function computeGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 75) return "A-";
  if (score >= 70) return "B+";
  if (score >= 65) return "B";
  if (score >= 60) return "B-";
  if (score >= 55) return "C+";
  if (score >= 50) return "C";
  if (score >= 45) return "C-";
  if (score >= 40) return "D+";
  if (score >= 35) return "D";
  if (score >= 30) return "D-";
  return "E";
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-400",
  "A-": "text-emerald-300",
  "B+": "text-blue-400",
  B: "text-blue-300",
  "B-": "text-omix-400",
  "C+": "text-omix-300",
  C: "text-amber-400",
  "C-": "text-amber-500",
  "D+": "text-orange-400",
  D: "text-orange-500",
  "D-": "text-red-400",
  E: "text-red-500",
};

export default function GradesPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [students, setStudents] = useState<StudentWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load classes on mount
  useEffect(() => {
    fetch("/api/classes?limit=200")
      .then((r) => r.json())
      .then((data) => setClasses(data.classes))
      .catch(() => {});
  }, []);

  // Load exams on mount
  useEffect(() => {
    fetch("/api/exams?limit=200")
      .then((r) => r.json())
      .then((data) => setExams(data.exams || []))
      .catch(() => {});
  }, []);

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }
    fetch(`/api/classes/${selectedClass}`)
      .then((r) => r.json())
      .then((data) => {
        setSubjects(data.class?.subjects || []);
      })
      .catch(() => {});
  }, [selectedClass]);

  // Load grade data when all three are selected
  useEffect(() => {
    if (!selectedClass || !selectedExam || !selectedSubject) {
      setStudents([]);
      return;
    }
    loadGradeData();
  }, [selectedClass, selectedExam, selectedSubject]);

  async function loadGradeData() {
    try {
      setLoading(true);

      // Load students in the class
      const studentsRes = await fetch(
        `/api/students?classId=${selectedClass}`
      );
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsRes.json();
      const rawStudents = studentsData.students || [];

      // Load existing grades
      const gradesRes = await fetch(
        `/api/grades?classId=${selectedClass}&examId=${selectedExam}&subjectId=${selectedSubject}`
      );
      const gradeMap: Record<string, { score: number | null; grade: string | null }> = {};
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        (gradesData.grades || []).forEach(
          (g: { studentId: string; score: number | null; grade: string | null }) => {
            gradeMap[g.studentId] = { score: g.score, grade: g.grade };
          }
        );
      }

      const mapped: StudentWithScore[] = rawStudents.map(
        (s: { id: string; admissionNo: string; firstName: string; lastName: string }) => {
          const existing = gradeMap[s.id];
          const scoreVal = existing?.score ?? "";
          const scoreNum = scoreVal !== "" ? Number(scoreVal) : "";
          return {
            id: s.id,
            admissionNo: s.admissionNo,
            firstName: s.firstName,
            lastName: s.lastName,
            score: scoreNum,
            grade:
              existing?.grade ??
              (scoreNum !== "" ? computeGrade(scoreNum as number) : ""),
          };
        }
      );

      setStudents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleScoreChange(studentId: string, value: string) {
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const scoreNum = num === "" ? "" : Number(num);
        return {
          ...s,
          score: scoreNum,
          grade: scoreNum !== "" ? computeGrade(scoreNum) : "",
        };
      })
    );
  }

  async function handleSave() {
    if (!selectedClass || !selectedExam || !selectedSubject) {
      setError("Please select class, exam, and subject");
      return;
    }

    const records = students
      .filter((s) => s.score !== "")
      .map((s) => ({
        studentId: s.id,
        subjectId: selectedSubject,
        examId: selectedExam,
        classId: selectedClass,
        score: s.score === "" ? null : Number(s.score),
        grade: s.grade || null,
      }));

    if (records.length === 0) {
      setError("No scores to save");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save grades");
      }

      setSuccess(`Grades saved for ${records.length} students`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Grade distribution for chart
  const gradeDistribution = [
    { grade: "A", count: 0, color: "#34d399" },
    { grade: "A-", count: 0, color: "#6ee7b7" },
    { grade: "B+", count: 0, color: "#60a5fa" },
    { grade: "B", count: 0, color: "#93c5fd" },
    { grade: "B-", count: 0, color: "#818cf8" },
    { grade: "C+", count: 0, color: "#a78bfa" },
    { grade: "C", count: 0, color: "#fbbf24" },
    { grade: "C-", count: 0, color: "#f59e0b" },
    { grade: "D+", count: 0, color: "#fb923c" },
    { grade: "D", count: 0, color: "#f97316" },
    { grade: "D-", count: 0, color: "#f87171" },
    { grade: "E", count: 0, color: "#ef4444" },
  ];

  students.forEach((s) => {
    if (s.grade) {
      const found = gradeDistribution.find((g) => g.grade === s.grade);
      if (found) found.count++;
    }
  });

  const chartData = gradeDistribution.filter((g) => g.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Grades</h1>
        <p className="text-gray-400 text-sm mt-1">
          Record and manage student grades and scores
        </p>
      </div>

      {/* Selectors */}
      <div className="glass rounded-2xl p-5 border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select exam...</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.term} - {e.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all disabled:opacity-40"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <a
              href={`/api/export?entity=grades${selectedClass ? `&classId=${selectedClass}` : ""}${selectedExam ? `&examId=${selectedExam}` : ""}`}
              title="Export grades to CSV"
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border hover:border-omix-500/30 text-gray-300 font-medium rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </a>
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

      {/* Grade Distribution Chart */}
      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-6 border-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-omix-400" />
            Grade Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(99,102,241,0.1)"
                />
                <XAxis
                  dataKey="grade"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(99,102,241,0.15)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(99,102,241,0.15)" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(18,18,42,0.95)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                    backdropFilter: "blur(12px)",
                  }}
                  cursor={{ fill: "rgba(99,102,241,0.1)" }}
                  formatter={(value: number) => [value, "Students"]}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  fill="url(#gradeGradient)"
                />
                <defs>
                  <linearGradient
                    id="gradeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grade Entry Table */}
      <div className="glass rounded-2xl overflow-hidden border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Score Entry
          </h2>
          <div className="flex items-center gap-2">
            {selectedClass && selectedExam && selectedSubject && (
              <span className="text-xs text-gray-500 bg-surface-2 px-2.5 py-1 rounded-lg">
                {students.length} students
              </span>
            )}
          </div>
        </div>

        {!selectedClass || !selectedExam || !selectedSubject ? (
          <div className="px-6 py-16 text-center">
            <GraduationCap className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Select a class, exam, and subject to enter grades
            </p>
          </div>
        ) : loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-surface-2 rounded-xl animate-pulse"
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
                    Score (0-100)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student, idx) => (
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
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={student.score}
                        onChange={(e) =>
                          handleScoreChange(student.id, e.target.value)
                        }
                        placeholder="—"
                        className="w-24 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none input-glow transition-all text-center"
                      />
                    </td>
                    <td className="px-6 py-3">
                      {student.grade ? (
                        <span
                          className={cn(
                            "text-sm font-bold",
                            GRADE_COLORS[student.grade] || "text-gray-400"
                          )}
                        >
                          {student.grade}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save Footer */}
        {students.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {students.filter((s) => s.score !== "").length} scores entered
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Grades
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
