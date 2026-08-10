"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Plus,
  Search,
  Banknote,
  CreditCard,
  Building2,
  Smartphone,
  Loader2,
  CheckCircle2,
  X,
  Receipt,
  PiggyBank,
  CalendarDays,
  Download,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";

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

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  transactionRef: string | null;
  term: string;
  academicYear: string;
  paymentDate: string;
  notes: string | null;
  feeStructure: { id: string; name: string; amount: number; frequency: string };
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
  };
}

const METHOD_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  mpesa: Smartphone,
  bank: Building2,
  card: CreditCard,
};

const METHOD_COLORS: Record<string, string> = {
  cash: "text-emerald-400 bg-emerald-500/10",
  mpesa: "text-omix-400 bg-omix-500/10",
  bank: "text-blue-400 bg-blue-500/10",
  card: "text-amber-400 bg-amber-500/10",
};

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("structures");
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formStudentId, setFormStudentId] = useState("");
  const [formStructureId, setFormStructureId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("cash");
  const [formTransactionRef, setFormTransactionRef] = useState("");
  const [formTerm, setFormTerm] = useState("Term 1");
  const [formAcademicYear, setFormAcademicYear] = useState(
    new Date().getFullYear().toString()
  );
  const [formNotes, setFormNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fees?limit=200");
      if (!res.ok) throw new Error("Failed to fetch fees data");
      const data = await res.json();
      setPayments(data.payments || []);
      setStructures(data.feeStructures || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load students for the modal
  useEffect(() => {
    if (showModal) {
      fetch("/api/students?limit=500")
        .then((r) => r.json())
        .then((data) => setStudents(data.students || []))
        .catch(() => {});
    }
  }, [showModal]);

  const filteredStudents = studentSearch
    ? students.filter(
        (s) =>
          `${s.firstName} ${s.lastName} ${s.admissionNo}`
            .toLowerCase()
            .includes(studentSearch.toLowerCase())
      )
    : students;

  const selectedFeeStructure = structures.find(
    (s) => s.id === formStructureId
  );

  function openPaymentModal() {
    setFormStudentId("");
    setFormStructureId("");
    setFormAmount("");
    setFormMethod("cash");
    setFormTransactionRef("");
    setFormTerm("Term 1");
    setFormAcademicYear(new Date().getFullYear().toString());
    setFormNotes("");
    setStudentSearch("");
    setShowModal(true);
  }

  async function handleRecordPayment() {
    if (!formStudentId || !formStructureId || !formAmount) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formStudentId,
          feeStructureId: formStructureId,
          amount: parseFloat(formAmount),
          method: formMethod,
          transactionRef: formTransactionRef || null,
          term: formTerm,
          academicYear: formAcademicYear,
          notes: formNotes || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to record payment");
      }

      setSuccess("Payment recorded successfully!");
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const paymentColumns = [
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (p: Payment) => (
        <span className="text-gray-200 font-medium">
          {p.student.firstName} {p.student.lastName}
        </span>
      ),
    },
    {
      key: "admissionNo",
      header: "Admission No",
      render: (p: Payment) => (
        <span className="font-mono text-xs text-omix-400">
          {p.student.admissionNo}
        </span>
      ),
    },
    {
      key: "feeStructure",
      header: "Fee Type",
      render: (p: Payment) => (
        <span className="text-gray-300">{p.feeStructure.name}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (p: Payment) => (
        <span className="text-emerald-400 font-semibold">
          {formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (p: Payment) => {
        const Icon = METHOD_ICONS[p.method] || Banknote;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
              METHOD_COLORS[p.method] || "text-gray-400 bg-surface-2"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
          </span>
        );
      },
    },
    {
      key: "paymentDate",
      header: "Date",
      sortable: true,
      render: (p: Payment) => (
        <span className="text-gray-400 text-sm">
          {formatDate(p.paymentDate)}
        </span>
      ),
    },
    {
      key: "term",
      header: "Term",
      render: (p: Payment) => (
        <span className="text-gray-400 text-sm">{p.term}</span>
      ),
    },
  ];

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalStructures = structures.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-12 w-12 bg-surface-2 rounded-xl mb-4" />
              <div className="h-8 w-24 bg-surface-2 rounded-lg mb-2" />
              <div className="h-4 w-32 bg-surface-2 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-8 animate-pulse">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-2 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Fees Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage fee structures and record payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export?entity=fees"
            title="Export fee payments to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border hover:border-omix-500/30 text-gray-300 font-medium rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </a>
          <button
            onClick={openPaymentModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Fee Structures"
          value={totalStructures}
          icon={Receipt}
          color="omix"
        />
        <StatCard
          title="Total Payments"
          value={payments.length}
          icon={PiggyBank}
          color="blue"
        />
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

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden border-border">
        <div className="flex border-b border-border">
          {[
            { key: "structures", label: "Fee Structures", icon: Receipt },
            { key: "payments", label: "Payments", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative",
                  isActive
                    ? "text-omix-400"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.key === "structures" && (
                  <span className="text-xs bg-surface-2 px-2 py-0.5 rounded-full text-gray-400">
                    {structures.length}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="feeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-omix-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Fee Structures Tab */}
          {activeTab === "structures" && (
            <div>
              {structures.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    No fee structures defined
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {structures.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
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
                        <span>{s.academicYear}</span>
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
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <DataTable<Payment>
              columns={paymentColumns}
              data={payments}
              searchable={true}
              searchKeys={[
                "student.firstName",
                "student.lastName",
                "student.admissionNo",
                "feeStructure.name",
                "method",
                "term",
                "transactionRef",
              ] as any}
              pageSize={15}
              loading={false}
              emptyMessage="No payments recorded yet"
            />
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Payment"
        size="lg"
      >
        <div className="space-y-5">
          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Student <span className="text-omix-400">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface-2">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-500 p-3 text-center">
                  No students found
                </p>
              ) : (
                filteredStudents.slice(0, 20).map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setFormStudentId(student.id);
                      setStudentSearch(
                        `${student.firstName} ${student.lastName}`
                      );
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between",
                      formStudentId === student.id
                        ? "bg-omix-500/20 text-omix-400"
                        : "text-gray-300 hover:bg-surface-3"
                    )}
                  >
                    <span>
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {student.admissionNo}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Fee Structure */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Fee Structure <span className="text-omix-400">*</span>
            </label>
            <select
              value={formStructureId}
              onChange={(e) => {
                setFormStructureId(e.target.value);
                const structure = structures.find(
                  (s) => s.id === e.target.value
                );
                if (structure) setFormAmount(structure.amount.toString());
              }}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
            >
              <option value="">Select fee structure...</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {formatCurrency(s.amount)} ({s.frequency})
                </option>
              ))}
            </select>
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
                className="w-full pl-12 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
          </div>

          {/* Method + Term + Year row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Method
              </label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Term
              </label>
              <select
                value={formTerm}
                onChange={(e) => setFormTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
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
                className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>
          </div>

          {/* Transaction Ref */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Transaction Reference
            </label>
            <input
              type="text"
              value={formTransactionRef}
              onChange={(e) => setFormTransactionRef(e.target.value)}
              placeholder="Optional reference number"
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Notes
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayment}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              Record Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
