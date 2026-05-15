"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  AlertCircle,
  School,
  GraduationCap,
  X,
  Save,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
export const dynamic = 'force-dynamic';

interface PerformanceRecord {
  id: string;
  subjectId: string;
  classId: string;
  examId: string;
  term: string;
  academicYear: string;
  studentCount: number | null;
  meanScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  passRate: number | null;
  createdAt: string;
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string; code: string };
  exam: { id: string; name: string; term: string; academicYear: string };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Class {
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

export default function DepartmentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formSubject, setFormSubject] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formExam, setFormExam] = useState("");
  const [formTerm, setFormTerm] = useState("");
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [formStudentCount, setFormStudentCount] = useState("");
  const [formMeanScore, setFormMeanScore] = useState("");
  const [formHighestScore, setFormHighestScore] = useState("");
  const [formLowestScore, setFormLowestScore] = useState("");
  const [formPassRate, setFormPassRate] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [perfRes, classRes, examRes] = await Promise.all([
        fetch("/api/subject-performance?limit=100"),
        fetch("/api/classes?limit=200"),
        fetch("/api/exams?limit=200"),
      ]);

      if (!perfRes.ok || !classRes.ok || !examRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const perfData = await perfRes.json();
      const classData = await classRes.json();
      const examData = await examRes.json();

      setRecords(perfData.records || []);
      setClasses(classData.classes || classData.data || []);
      setExams(examData.exams || examData.data || []);

      // Extract unique subjects from performance records
      const subjectMap = new Map<string, Subject>();
      (perfData.records || []).forEach((r: PerformanceRecord) => {
        if (r.subject && !subjectMap.has(r.subject.id)) {
          subjectMap.set(r.subject.id, r.subject);
        }
      });
      setSubjects(Array.from(subjectMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Derived stats
  const totalSubjects = subjects.length;
  const totalClasses = classes.length;
  const validMeanScores = records
    .filter((r) => r.meanScore !== null)
    .map((r) => r.meanScore as number);
  const overallMeanScore =
    validMeanScores.length > 0
      ? (validMeanScores.reduce((a, b) => a + b, 0) / validMeanScores.length).toFixed(1)
      : "—";
  const validPassRates = records
    .filter((r) => r.passRate !== null)
    .map((r) => r.passRate as number);
  const overallPassRate =
    validPassRates.length > 0
      ? (validPassRates.reduce((a, b) => a + b, 0) / validPassRates.length).toFixed(1) + "%"
      : "—";

  // Per-class performance with subject breakdown
  const classPerformanceMap = new Map<
    string,
    { className: string; subjects: { name: string; meanScore: number | null }[]; overallMean: number }
  >();
  records.forEach((r) => {
    if (!r.classId) return;
    const existing = classPerformanceMap.get(r.classId) || {
      className: r.class?.name || `Class ${r.classId}`,
      subjects: [],
      overallMean: 0,
    };
    existing.subjects.push({
      name: r.subject?.name || "Unknown",
      meanScore: r.meanScore,
    });
    classPerformanceMap.set(r.classId, existing);
  });
  classPerformanceMap.forEach((value, key) => {
    const scores = value.subjects
      .filter((s) => s.meanScore !== null)
      .map((s) => s.meanScore as number);
    value.overallMean =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0;
    classPerformanceMap.set(key, value);
  });

  // Recent entries (last 5)
  const recentEntries = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSaving(true);

    try {
      const body: Record<string, unknown> = {
        subjectId: formSubject,
        classId: formClass,
        examId: formExam,
        term: formTerm,
        academicYear: formYear,
      };
      if (formStudentCount) body.studentCount = parseInt(formStudentCount);
      if (formMeanScore) body.meanScore = parseFloat(formMeanScore);
      if (formHighestScore) body.highestScore = parseFloat(formHighestScore);
      if (formLowestScore) body.lowestScore = parseFloat(formLowestScore);
      if (formPassRate) body.passRate = parseFloat(formPassRate);

      const res = await fetch("/api/subject-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save record");
      }

      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormSaving(false);
    }
  }

  function resetForm() {
    setFormSubject("");
    setFormClass("");
    setFormExam("");
    setFormTerm("");
    setFormYear(new Date().getFullYear().toString());
    setFormStudentCount("");
    setFormMeanScore("");
    setFormHighestScore("");
    setFormLowestScore("");
    setFormPassRate("");
    setFormError("");
  }

  const performanceTableColumns = [
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (item: { className: string; overallMean: number }) => item.className,
    },
    {
      key: "overallMean",
      header: "Overall Mean",
      sortable: true,
      className: "text-center",
      render: (item: { className: string; overallMean: number }) => (
        <span className={cn(item.overallMean >= 50 ? "text-emerald-400" : "text-amber-400")}>
          {item.overallMean.toFixed(1)}
        </span>
      ),
    },
    {
      key: "subjects",
      header: "Subject Breakdown",
      render: (item: { className: string; overallMean: number; subjects: { name: string; meanScore: number | null }[] }) => (
        <div className="flex flex-wrap gap-1.5">
          {item.subjects.map((s, i) => (
            <span
              key={i}
              className="text-[11px] bg-surface-2 px-2 py-0.5 rounded-full border border-border text-gray-400"
            >
              {s.name}: {s.meanScore !== null ? s.meanScore.toFixed(1) : "—"}
            </span>
          ))}
        </div>
      ),
    },
  ];

  const recentEntriesColumns = [
    {
      key: "subject",
      header: "Subject",
      render: (item: PerformanceRecord) => item.subject?.name || "—",
    },
    {
      key: "class",
      header: "Class",
      render: (item: PerformanceRecord) => item.class?.name || "—",
    },
    {
      key: "meanScore",
      header: "Mean",
      sortable: true,
      render: (item: PerformanceRecord) =>
        item.meanScore !== null ? item.meanScore.toFixed(1) : "—",
    },
    {
      key: "passRate",
      header: "Pass Rate",
      sortable: true,
      render: (item: PerformanceRecord) =>
        item.passRate !== null ? `${item.passRate}%` : "—",
    },
    {
      key: "createdAt",
      header: "Date",
      render: (item: PerformanceRecord) => formatDate(item.createdAt),
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
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const classPerformanceData = Array.from(classPerformanceMap.entries()).map(
    ([classId, data]) => ({
      classId,
      className: data.className,
      subjects: data.subjects,
      overallMean: data.overallMean,
    })
  );

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
            Academic Departments
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Subject performance tracking and analytics
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Record Performance
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
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          <StatCard title="Total Subjects" value={totalSubjects} icon={BookOpen} color="omix" />
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          <StatCard title="Total Classes" value={totalClasses} icon={GraduationCap} color="blue" />
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          <StatCard
            title="Mean Score"
            value={overallMeanScore}
            icon={TrendingUp}
            color="green"
          />
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          <StatCard
            title="Pass Rate"
            value={overallPassRate}
            icon={CheckCircle2}
            color="amber"
          />
        </motion.div>
      </motion.div>

      {/* Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Per-Class Performance
          </h2>
          <a
            href="/departments/dashboard/performance"
            className="flex items-center gap-1 text-sm text-omix-400 hover:text-omix-300 transition-colors"
          >
            View Full Report <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        {classPerformanceData.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border-border">
            <School className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No performance records yet. Click &quot;Record Performance&quot; to add data.
            </p>
          </div>
        ) : (
          <DataTable
            columns={performanceTableColumns}
            data={classPerformanceData}
            searchable={false}
            pageSize={10}
          />
        )}
      </motion.div>

      {/* Recent Entries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Performance Entries
        </h2>
        {recentEntries.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border-border">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No recent entries
            </p>
          </div>
        ) : (
          <DataTable
            columns={recentEntriesColumns}
            data={recentEntries}
            searchable={false}
            pageSize={5}
          />
        )}
      </motion.div>

      {/* Record Performance Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title="Record Subject Performance"
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 focus:outline-none input-glow transition-all"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Class <span className="text-red-400">*</span>
              </label>
              <select
                value={formClass}
                onChange={(e) => setFormClass(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 focus:outline-none input-glow transition-all"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Exam */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Exam <span className="text-red-400">*</span>
              </label>
              <select
                value={formExam}
                onChange={(e) => setFormExam(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 focus:outline-none input-glow transition-all"
              >
                <option value="">Select exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} (Term {e.term}, {e.academicYear})
                  </option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Term <span className="text-red-400">*</span>
              </label>
              <select
                value={formTerm}
                onChange={(e) => setFormTerm(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 focus:outline-none input-glow transition-all"
              >
                <option value="">Select term</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Academic Year <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
                placeholder="e.g. 2025"
                required
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>

            {/* Student Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Student Count
              </label>
              <input
                type="number"
                value={formStudentCount}
                onChange={(e) => setFormStudentCount(e.target.value)}
                placeholder="e.g. 40"
                min={0}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
          </div>

          {/* Score fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Mean Score
              </label>
              <input
                type="number"
                value={formMeanScore}
                onChange={(e) => setFormMeanScore(e.target.value)}
                placeholder="0–100"
                min={0}
                max={100}
                step={0.1}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Highest Score
              </label>
              <input
                type="number"
                value={formHighestScore}
                onChange={(e) => setFormHighestScore(e.target.value)}
                placeholder="0–100"
                min={0}
                max={100}
                step={0.1}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Lowest Score
              </label>
              <input
                type="number"
                value={formLowestScore}
                onChange={(e) => setFormLowestScore(e.target.value)}
                placeholder="0–100"
                min={0}
                max={100}
                step={0.1}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Pass Rate (%)
              </label>
              <input
                type="number"
                value={formPassRate}
                onChange={(e) => setFormPassRate(e.target.value)}
                placeholder="e.g. 75"
                min={0}
                max={100}
                step={0.1}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
          </div>

          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
            >
              {formError}
            </motion.p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={formSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Record
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-6 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-300 hover:text-gray-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
