"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter, Download } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  specialization: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  _count: { classes: number; subjects: number };
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/teachers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch teachers");
      const data = await res.json();
      setTeachers(data.teachers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const columns = [
    {
      key: "employeeNo",
      header: "Employee No",
      sortable: true,
      render: (t: Teacher) => (
        <span className="font-mono text-xs text-omix-400">{t.employeeNo}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (t: Teacher) => (
        <span className="text-gray-200 font-medium">
          {t.firstName} {t.lastName}
        </span>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      sortable: true,
      render: (t: Teacher) => (
        <span className="capitalize text-gray-400">{t.gender || "—"}</span>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      render: (t: Teacher) => (
        <span className="text-gray-300">{t.specialization || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t: Teacher) => (
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            t.status === "active"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
          )}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "classes",
      header: "Classes/Subjects",
      render: (t: Teacher) => (
        <span className="text-xs text-gray-500">
          {t._count.classes} classes, {t._count.subjects} subjects
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Teachers</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage teacher records and assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export?entity=teachers"
            title="Export teachers to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border hover:border-omix-500/30 text-gray-300 font-medium rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </a>
          <button
            onClick={() => router.push("/teachers/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 border-border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers..."
              className="w-full pl-4 pr-4 py-2 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-2 border border-border rounded-xl text-sm text-gray-300 focus:outline-none input-glow transition-all"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <DataTable<Teacher>
        columns={columns}
        data={teachers}
        searchable={false}
        loading={loading}
        emptyMessage="No teachers found"
        onRowClick={(teacher) => router.push(`/teachers/${teacher.id}`)}
        pageSize={15}
      />
    </div>
  );
}
