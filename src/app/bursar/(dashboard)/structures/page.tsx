"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { z } from "zod";
export const dynamic = 'force-dynamic';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  academicYear: string;
  description: string | null;
  classId: string | null;
  _count?: { payments: number };
}

const structureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum(["term", "monthly", "yearly"]),
  academicYear: z.string().min(1, "Academic year is required"),
  description: z.string().optional().nullable(),
});

export default function BursarStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formFrequency, setFormFrequency] = useState("term");
  const [formAcademicYear, setFormAcademicYear] = useState(
    new Date().getFullYear().toString()
  );
  const [formDescription, setFormDescription] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/fees/structures?limit=100");
      if (!res.ok) throw new Error("Failed to fetch fee structures");
      const data = await res.json();
      setStructures(data.structures || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  function openCreateModal() {
    setFormName("");
    setFormAmount("");
    setFormFrequency("term");
    setFormAcademicYear(new Date().getFullYear().toString());
    setFormDescription("");
    setFormErrors({});
    setShowCreateModal(true);
  }

  async function handleCreate() {
    setFormErrors({});

    try {
      const data = structureSchema.parse({
        name: formName,
        amount: parseFloat(formAmount),
        frequency: formFrequency,
        academicYear: formAcademicYear,
        description: formDescription || null,
      });

      setSaving(true);
      setError("");

      const res = await fetch("/api/fees/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create fee structure");
      }

      setSuccess("Fee structure created successfully!");
      setShowCreateModal(false);
      fetchStructures();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path.join(".");
          fieldErrors[path] = e.message;
        });
        setFormErrors(fieldErrors);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-surface-2 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-10 w-10 bg-surface-2 rounded-lg mb-4" />
              <div className="h-6 w-32 bg-surface-2 rounded-lg mb-2" />
              <div className="h-8 w-24 bg-surface-2 rounded-lg mb-2" />
              <div className="h-4 w-20 bg-surface-2 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !structures.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Fee Structures</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage fee structures
          </p>
        </div>
        <div className="glass rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchStructures}
            className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
          >
            Retry
          </button>
        </div>
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
          <h1 className="text-2xl font-bold gradient-text">Fee Structures</h1>
          <p className="text-gray-400 text-sm mt-1">
            Define and manage fee structures for the school
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm"
        >
          <Plus className="w-4 h-4" />
          New Structure
        </button>
      </motion.div>

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

      {/* Structures Grid */}
      {structures.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No fee structures yet
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Create your first fee structure to start tracking payments.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm"
          >
            Create Fee Structure
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {structures.map((s) => (
            <motion.div
              key={s.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 },
              }}
              className="glass rounded-xl p-5 border-border hover:glow-sm transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-omix-500/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-omix-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-surface-2 px-2.5 py-1 rounded-full capitalize">
                  {s.frequency}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                {s.name}
              </h3>
              <p className="text-2xl font-bold gradient-text mb-2">
                {formatCurrency(s.amount)}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {s.academicYear}
                </span>
                {s._count && (
                  <span>{s._count.payments} payments</span>
                )}
              </div>
              {s.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {s.description}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Fee Structure Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Fee Structure"
        size="md"
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Structure Name <span className="text-omix-400">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Tuition Fee, Lab Fee"
              className={cn(
                "w-full px-4 py-2.5 bg-surface-2 border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all",
                formErrors.name ? "border-red-500/50" : "border-border"
              )}
            />
            {formErrors.name && (
              <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Amount <span className="text-omix-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                KSh
              </span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full pl-12 pr-4 py-2.5 bg-surface-2 border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all",
                  formErrors.amount ? "border-red-500/50" : "border-border"
                )}
              />
            </div>
            {formErrors.amount && (
              <p className="text-xs text-red-400 mt-1">{formErrors.amount}</p>
            )}
          </div>

          {/* Frequency + Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Frequency
              </label>
              <select
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
                className={cn(
                  "w-full px-4 py-2.5 bg-surface-2 border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all",
                  formErrors.frequency ? "border-red-500/50" : "border-border"
                )}
              >
                <option value="term">Per Term</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Academic Year
              </label>
              <input
                type="text"
                value={formAcademicYear}
                onChange={(e) => setFormAcademicYear(e.target.value)}
                placeholder="2025"
                className={cn(
                  "w-full px-4 py-2.5 bg-surface-2 border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all",
                  formErrors.academicYear
                    ? "border-red-500/50"
                    : "border-border"
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className={cn(
                "w-full px-4 py-2.5 bg-surface-2 border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all resize-none",
                formErrors.description ? "border-red-500/50" : "border-border"
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              Create Structure
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
