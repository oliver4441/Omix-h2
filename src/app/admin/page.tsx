"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  Ban,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

// --- Types ---
interface SchoolStats {
  users: number;
  students: number;
  teachers: number;
}

interface School {
  id: string;
  name: string;
  email: string;
  slug: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: SchoolStats;
}

// Derive 'status' from isApproved/isActive for UI display
type DisplayStatus = "approved" | "pending" | "rejected" | "inactive";

function getDisplayStatus(school: School): DisplayStatus {
  if (school.isApproved && school.isActive) return "approved";
  if (!school.isApproved && !school.isActive) return "pending";
  if (!school.isApproved) return "pending";
  if (school.isApproved && !school.isActive) return "inactive";
  return "pending";
}

// --- Main Dashboard Component ---
function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    schoolName: "",
    schoolEmail: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const pageSize = 5;

  // Redirect non-super-admin users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch schools from real API
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("limit", "100");

      const response = await fetch(`/api/admin/schools?${params.toString()}`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setSchools(data.schools ?? []);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Client-side filtering
  const filtered = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      false;
    const status = getDisplayStatus(s);
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/schools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true, isActive: true }),
      });
      if (res.ok) {
        setSchools((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isApproved: true, isActive: true } : s))
        );
      }
    } catch (err) {
      console.error("Failed to approve school:", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/schools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: false, isActive: false }),
      });
      if (res.ok) {
        setSchools((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isApproved: false, isActive: false } : s))
        );
      }
    } catch (err) {
      console.error("Failed to reject school:", err);
    }
  };

  const handleToggleActive = async (id: string) => {
    const school = schools.find((s) => s.id === id);
    if (!school) return;
    try {
      const res = await fetch(`/api/admin/schools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !school.isActive }),
      });
      if (res.ok) {
        setSchools((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err) {
      console.error("Failed to toggle school:", err);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Failed to create school");
        setAddLoading(false);
        return;
      }

      // Refresh the list
      await fetchSchools();
      setAddForm({ schoolName: "", schoolEmail: "", adminName: "", adminEmail: "", adminPassword: "" });
      setAddLoading(false);
      setShowAddModal(false);
    } catch (err) {
      setAddError("Network error. Please try again.");
      setAddLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-omix-500/30 border-t-omix-500 rounded-full"
        />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "super_admin") {
    return null;
  }

  const pendingCount = schools.filter((s) => !s.isApproved && !s.isActive).length;
  const approvedCount = schools.filter((s) => s.isApproved && s.isActive).length;

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    inactive: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    approved: <CheckCircle className="w-3.5 h-3.5" />,
    pending: <Clock className="w-3.5 h-3.5" />,
    rejected: <XCircle className="w-3.5 h-3.5" />,
    inactive: <Ban className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-omix-500/10 glow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-omix-500 to-omix-700 flex items-center justify-center glow-sm flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                School Approvals
                <Sparkles className="w-4 h-4 text-omix-400" />
              </h1>
              <p className="text-sm text-gray-400">
                Welcome back, <span className="text-omix-400 font-medium">{session?.user?.name || "Admin"}</span> — manage school registrations and approvals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm">
              <span className="text-gray-400">Total: </span>
              <span className="text-white font-semibold">{schools.length}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm">
              <span className="text-gray-400">Pending: </span>
              <span className="text-amber-400 font-semibold">{pendingCount}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm">
              <span className="text-gray-400">Approved: </span>
              <span className="text-emerald-400 font-semibold">{approvedCount}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search schools by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 focus:outline-none input-glow transition-all cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={fetchSchools}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-gray-400 hover:text-gray-200 hover:border-omix-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium text-sm transition-all duration-300 flex items-center gap-2 glow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add School</span>
          </button>
        </div>
      </div>

      {/* Schools List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-2 rounded w-1/3" />
                  <div className="h-3 bg-surface-2 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : paged.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-12 text-center border border-border"
        >
          <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Schools Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {search || filterStatus !== "all"
              ? "No schools match your current filters. Try adjusting your search criteria."
              : "There are no schools registered yet. Click the button above to add the first school."}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {paged.map((school, idx) => {
            const displayStatus = getDisplayStatus(school);
            return (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl p-5 border border-border hover:border-omix-500/20 transition-all duration-300 glow-sm"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: School Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      displayStatus === "approved"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : displayStatus === "pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : displayStatus === "inactive"
                        ? "bg-gray-500/10 text-gray-400"
                        : "bg-red-500/10 text-red-400"
                    )}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-white truncate">
                          {school.name}
                        </h3>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                          statusColors[displayStatus]
                        )}>
                          {statusIcons[displayStatus]}
                          {displayStatus === "approved" ? "Approved" :
                           displayStatus === "pending" ? "Pending" :
                           displayStatus === "inactive" ? "Inactive" : "Rejected"}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                          school.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        )}>
                          {school.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {school.email || "No email"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Registered {formatDate(school.createdAt)}
                        </span>
                        {school._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {school._count.users} users
                            </span>
                            <span className="text-xs text-gray-600">
                              {school._count.students} students · {school._count.teachers} teachers
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
                    {displayStatus === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(school.id)}
                          className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(school.id)}
                          className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {(displayStatus === "approved" || displayStatus === "inactive") && (
                      <button
                        onClick={() => handleToggleActive(school.id)}
                        className={cn(
                          "flex-1 lg:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 border",
                          school.isActive
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 hover:border-amber-500/40"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
                        )}
                      >
                        {school.isActive ? (
                          <><Ban className="w-4 h-4" /> Deactivate</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> Activate</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({filtered.length} schools)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                    p === page
                      ? "bg-omix-500 text-white"
                      : "bg-surface-2 border border-border text-gray-400 hover:text-gray-200"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add School Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New School"
        size="md"
      >
        <form onSubmit={handleAddSchool} className="space-y-5">
          {addError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{addError}</span>
            </div>
          )}

          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-white mb-1">School Information</h3>
            <p className="text-xs text-gray-500">Details about the school being registered</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              School Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={addForm.schoolName}
              onChange={(e) => setAddForm((f) => ({ ...f, schoolName: e.target.value }))}
              placeholder="e.g. Nairobi High School"
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              School Email
            </label>
            <input
              type="email"
              value={addForm.schoolEmail}
              onChange={(e) => setAddForm((f) => ({ ...f, schoolEmail: e.target.value }))}
              placeholder="admin@school.com"
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>

          <div className="border-b border-border pb-4 pt-2">
            <h3 className="text-sm font-semibold text-white mb-1">Admin Account</h3>
            <p className="text-xs text-gray-500">This person will be the school administrator</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={addForm.adminName}
              onChange={(e) => setAddForm((f) => ({ ...f, adminName: e.target.value }))}
              placeholder="e.g. John Kamau"
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={addForm.adminEmail}
              onChange={(e) => setAddForm((f) => ({ ...f, adminEmail: e.target.value }))}
              placeholder="admin@school.com"
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={addForm.adminPassword}
              onChange={(e) => setAddForm((f) => ({ ...f, adminPassword: e.target.value }))}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-2 border border-border text-gray-300 hover:text-gray-200 hover:border-omix-500/30 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLoading || !addForm.schoolName || !addForm.adminName || !addForm.adminEmail || !addForm.adminPassword}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-sm"
            >
              {addLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Register School
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// --- Wrapped in Suspense ---
export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-2 border-omix-500/30 border-t-omix-500 rounded-full mx-auto mb-4"
            />
            <p className="text-sm text-gray-500">Loading admin panel...</p>
          </div>
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
