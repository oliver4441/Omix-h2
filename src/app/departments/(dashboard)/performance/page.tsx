"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Plus,
  AlertCircle,
  Download,
  Save,
  X,
  Filter,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
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

export default function DepartmentPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [exams, setExams] = useState<{ id: string; name: string; term: string; academicYear: string }[]>([]);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");
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

  useEffect(() => {
    fetchFilters();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass, filterSubject, filterTerm, filterYear]);

  async function fetchFilters() {
    try {
      const [classRes, examRes] = await Promise.all([
        fetch("/api/classes?limit=200"),
        fetch("/api/exams?limit=200"),
      ]);

      if (classRes.ok) {
        const data = await classRes.json();
        setClasses(data.classes || data.data || []);
      }
      if (examRes.ok) {
        const data = await examRes.json();
        setExams(data.exams || data.data || []);
      }
    } catch {
      // ignore filter load errors
    }
  }

  async function fetchRecords() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "200" });
      if (filterClass) params.set("classId", filterClass);
      if (filterSubject) params.set("subjectId", filterSubject);
      if (filterTerm) params.set("term", filterTerm);
      if (filterYear) params.set("academicYear", filterYear);

      const res = await fetch(`/api/subject-performance?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch records");

      const data = await res.json();
      setRecords(data.records || []);

      // Extract unique subjects
      const subjectMap = new Map<string, { id: string; name: string; code: string }>();
      (data.records || []).forEach((r: PerformanceRecord) => {
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
      fetchRecords();
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

  function handleExport() {
    // Placeholder: In a real app, this would generate CSV/Excel
    alert("Export functionality coming soon.");
  }

  const columns = [
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (item: PerformanceRecord) => item.class?.name || "—",
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (item: PerformanceRecord) => item.subject?.name || "—",
    },
    {
      key: "exam",
      header: "Exam",
      render: (item: PerformanceRecord) => item.exam?.name || "—",
    },
    {
      key: "meanScore",
      header: "Mean Score",
      sortable: true,
      className: "text-center",
      render: (item: PerformanceRecord) =>
        item.meanScore !== null ? (
          <span className={cn(item.meanScore >= 50 ? "text-emerald-400" : "text-amber-400")}>
            {item.meanScore.toFixed(1)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "highestScore",
      header: "Highest",
      sortable: true,
      className: "text-center",
      render: (item: PerformanceRecord) =>
        item.highestScore !== null ? item.highestScore.toFixed(1) : "—",
    },
    {
      key: "lowestScore",
      header: "Lowest",
      sortable: true,
      className: "text-center",
      render: (item: PerformanceRecord) =>
        item.lowestScore !== null ? item.lowestScore.toFixed(1) : "—",
    },
    {
      key: "passRate",
      header: "Pass Rate",
      sortable: true,
      className: "text-center",
      render: (item: PerformanceRecord) =>
        item.passRate !== null ? `${item.passRate}%` : "—",
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (item: PerformanceRecord) => formatDate(item.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Performance Tracking
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Subject and class performance records across terms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-gray-300 hover:text-gray-100 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 border-border"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400 font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-100 focus:outline-none input-glow transition-all"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-100 focus:outline-none input-glow transition-all"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-100 focus:outline-none input-glow transition-all"
          >
            <option value="">All Terms</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
          <input
            type="text"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            placeholder="Academic Year"
            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
          />
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {error ? (
          <div className="glass rounded-2xl p-8 text-center border-border">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchRecords}
              className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            searchable={true}
            searchKeys={["subjectId", "classId", "examId", "term", "academicYear"]}
            pageSize={15}
            emptyMessage="No performance records found. Adjust filters or add a new record."
            loading={loading}
          />
        )}
      </motion.div>

      {/* Add Record Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title="Add Performance Record"
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
