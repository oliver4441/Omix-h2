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
interface School {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: "approved" | "pending" | "rejected";
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    students: number;
    teachers: number;
  };
}

// --- Placeholder Data ---
const PLACEHOLDER_SCHOOLS: School[] = [
  {
    id: "1",
    name: "Nairobi High School",
    email: "admin@nairobigirls.ac.ke",
    slug: "nairobi-high",
    status: "approved",
    isActive: true,
    createdAt: "2025-01-15T10:30:00Z",
    _count: { users: 12, students: 540, teachers: 28 },
  },
  {
    id: "2",
    name: "Mombasa Academy",
    email: "admin@mombasaacademy.com",
    slug: "mombasa-academy",
    status: "pending",
    isActive: false,
    createdAt: "2025-03-20T08:15:00Z",
    _count: { users: 3, students: 120, teachers: 8 },
  },
  {
    id: "3",
    name: "Kisumu Day School",
    email: "admin@kisumuday.sc.ke",
    slug: "kisumu-day",
    status: "approved",
    isActive: true,
    createdAt: "2024-09-01T14:00:00Z",
    _count: { users: 8, students: 320, teachers: 18 },
  },
  {
    id: "4",
    name: "Eldoret International",
    email: "info@eldoretintl.com",
    slug: "eldoret-intl",
    status: "pending",
    isActive: true,
    createdAt: "2025-04-10T09:45:00Z",
    _count: { users: 1, students: 0, teachers: 0 },
  },
  {
    id: "5",
    name: "Nakuru Boys High",
    email: "admin@nakuruboys.sc.ke",
    slug: "nakuru-boys",
    status: "rejected",
    isActive: false,
    createdAt: "2025-02-28T11:20:00Z",
    _count: { users: 0, students: 0, teachers: 0 },
  },
  {
    id: "6",
    name: "Machakos University Prep",
    email: "contact@machakosprep.edu",
    slug: "machakos-prep",
    status: "approved",
    isActive: false,
    createdAt: "2024-11-05T16:00:00Z",
    _count: { users: 5, students: 200, teachers: 14 },
  },
];

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
  const [addForm, setAddForm] = useState({ name: "", email: "", slug: "" });
  const [addLoading, setAddLoading] = useState(false);
  const pageSize = 5;

  // Redirect non-super-admin users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch schools (placeholder fetch)
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      // Attempt real API call — falls back to placeholder data
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools ?? data ?? []);
      } else {
        // API not ready yet — use placeholder data
        await new Promise((r) => setTimeout(r, 600));
        setSchools(PLACEHOLDER_SCHOOLS);
      }
    } catch {
      // Network error — use placeholder data
      await new Promise((r) => setTimeout(r, 600));
      setSchools(PLACEHOLDER_SCHOOLS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Filter & paginate
  const filtered = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const handleApprove = async (id: string) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "approved" as const, isActive: true } : s))
    );
  };

  const handleReject = async (id: string) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "rejected" as const, isActive: false } : s))
    );
  };

  const handleToggleActive = async (id: string) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    const newSchool: School = {
      id: `new-${Date.now()}`,
      name: addForm.name,
      email: addForm.email,
      slug: addForm.slug || addForm.name.toLowerCase().replace(/\s+/g, "-"),
      status: "pending",
      isActive: false,
      createdAt: new Date().toISOString(),
      _count: { users: 0, students: 0, teachers: 0 },
    };
    setSchools((prev) => [newSchool, ...prev]);
    setAddForm({ name: "", email: "", slug: "" });
    setAddLoading(false);
    setShowAddModal(false);
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

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    approved: <CheckCircle className="w-3.5 h-3.5" />,
    pending: <Clock className="w-3.5 h-3.5" />,
    rejected: <XCircle className="w-3.5 h-3.5" />,
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
                Super Admin Panel
                <Sparkles className="w-4 h-4 text-omix-400" />
              </h1>
              <p className="text-sm text-gray-400">
                Welcome back, <span className="text-omix-400 font-medium">{session?.user?.name || "Admin"}</span> — you have full system-wide access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm">
              <span className="text-gray-400">Total Schools: </span>
              <span className="text-white font-semibold">{schools.length}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm">
              <span className="text-gray-400">Pending: </span>
              <span className="text-amber-400 font-semibold">
                {schools.filter((s) => s.status === "pending").length}
              </span>
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
            <option value="rejected">Rejected</option>
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
          {paged.map((school, idx) => (
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
                    school.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : school.status === "pending"
                      ? "bg-amber-500/10 text-amber-400"
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
                        statusColors[school.status]
                      )}>
                        {statusIcons[school.status]}
                        {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
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
                        {school.email}
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
                  {school.status === "pending" && (
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
                  {school.status === "approved" && (
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
          ))}
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
        title="Add New School"
        size="md"
      >
        <form onSubmit={handleAddSchool} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              School Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nairobi High School"
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@school.com"
              required
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug (URL identifier)
            </label>
            <input
              type="text"
              value={addForm.slug}
              onChange={(e) => setAddForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Auto-generated from name if empty"
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Used in URLs: /schools/your-slug
            </p>
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
              disabled={addLoading || !addForm.name || !addForm.email}
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
                  Add School
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
