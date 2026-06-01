"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, Save, ArrowLeft, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  academicYear: string;
}

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
}

export default function NewFeePaymentPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    studentId: "",
    feeStructureId: "",
    amount: "",
    method: "cash" as "cash" | "mpesa" | "bank" | "card",
    transactionRef: "",
    term: "",
    academicYear: new Date().getFullYear().toString(),
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsRes, feesRes] = await Promise.all([
          fetch("/api/students?limit=1000"),
          fetch("/api/fees/structures?limit=1000"),
        ]);
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(data.students || []);
        }
        if (feesRes.ok) {
          const data = await feesRes.json();
          setFeeStructures(data.structures || []);
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, []);

  const selectedStructure = feeStructures.find((s) => s.id === form.feeStructureId);

  useEffect(() => {
    if (selectedStructure) {
      setForm((f) => ({ ...f, amount: selectedStructure.amount.toString() }));
    }
  }, [selectedStructure]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      setSuccess("Payment recorded successfully!");
      setTimeout(() => router.push("/fees"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-omix-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Fees
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 glow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Record Fee Payment</h1>
            <p className="text-sm text-gray-500">Log a new fee payment from a student</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Student <span className="text-omix-400">*</span>
            </label>
            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.admissionNo} — {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fee Structure <span className="text-omix-400">*</span>
            </label>
            <select
              value={form.feeStructureId}
              onChange={(e) => setForm({ ...form, feeStructureId: e.target.value })}
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select fee structure</option>
              {feeStructures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatCurrency(s.amount)} ({s.frequency} — {s.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (KES) <span className="text-omix-400">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method <span className="text-omix-400">*</span>
              </label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction Reference
            </label>
            <input
              type="text"
              value={form.transactionRef}
              onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
              placeholder="e.g., M-Pesa receipt number"
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Term <span className="text-omix-400">*</span>
              </label>
              <select
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                required
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
              >
                <option value="">Select term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Academic Year <span className="text-omix-400">*</span>
              </label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                required
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Optional notes about this payment"
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Record Payment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl bg-surface-2 border border-border text-gray-400 hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
