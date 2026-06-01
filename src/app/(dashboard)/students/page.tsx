"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  class: { name: string } | null;
  status: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formAdmissionNo, setFormAdmissionNo] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formGender, setFormGender] = useState("male");
  const [formClassId, setFormClassId] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (showAddModal) {
      fetch("/api/classes?limit=200")
        .then((r) => r.json())
        .then((data) => setClasses(data.classes || []))
        .catch(() => {});
    }
  }, [showAddModal]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formAdmissionNo || !formFirstName || !formLastName || !formClassId) {
      setError("Please fill in all required fields");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionNo: formAdmissionNo,
          firstName: formFirstName,
          lastName: formLastName,
          gender: formGender,
          classId: formClassId,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add student");
      }
      setSuccess("Student added successfully!");
      setShowAddModal(false);
      setFormAdmissionNo("");
      setFormFirstName("");
      setFormLastName("");
      setFormGender("male");
      setFormClassId("");
      fetchStudents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: "admissionNo",
      header: "Admission No",
      sortable: true,
      render: (s: Student) => (
        <span className="font-mono text-xs text-omix-400">{s.admissionNo}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (s: Student) => (
        <span className="text-gray-200 font-medium">
          {s.firstName} {s.lastName}
        </span>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      render: (s: Student) => (
        <span className="text-gray-400 text-sm capitalize">{s.gender}</span>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (s: Student) => (
        <span className="text-gray-300 text-sm">{s.class?.name || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s: Student) => (
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            s.status === "active"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          )}
        >
          {s.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (s: Student) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${s.id}`}
            className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-omix-400 hover:border-omix-500/30 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Students</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all students in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/students/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-2 border border-border hover:border-omix-500/30 text-gray-300 font-medium rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Success / Error */}
      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </p>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Table */}
      <DataTable<Student>
        columns={columns}
        data={students}
        searchable={true}
        searchKeys={["admissionNo", "firstName", "lastName", "gender", "status"]}
        pageSize={10}
        loading={loading}
        emptyMessage="No students found"
      />

      {/* Quick Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Quick Add Student" size="lg">
        <form onSubmit={handleAddStudent} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Admission No <span className="text-omix-400">*</span>
              </label>
              <input
                type="text"
                value={formAdmissionNo}
                onChange={(e) => setFormAdmissionNo(e.target.value)}
                placeholder="e.g., ADM-001"
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Gender
              </label>
              <select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                First Name <span className="text-omix-400">*</span>
              </label>
              <input
                type="text"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Last Name <span className="text-omix-400">*</span>
              </label>
              <input
                type="text"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Class <span className="text-omix-400">*</span>
            </label>
            <select
              value={formClassId}
              onChange={(e) => setFormClassId(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
