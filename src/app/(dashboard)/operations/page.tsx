"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileText,
  DollarSign,
  Library,
  FlaskConical,
  Megaphone,
  CalendarClock,
  BookMarked,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number;
  updated: number;
  failed: number;
  errors: { row: number; error: string }[];
  totalRows: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userName: string | null;
  metadata: string | null;
  createdAt: string;
}

const EXPORT_ENTITIES = [
  { key: "students", label: "Students", desc: "Admission, contacts, class, status", icon: Users },
  { key: "teachers", label: "Teachers", desc: "Staff profiles and specializations", icon: GraduationCap },
  { key: "classes", label: "Classes", desc: "Classes and enrollment counts", icon: BookOpen },
  { key: "attendance", label: "Attendance", desc: "Daily attendance records", icon: ClipboardCheck },
  { key: "grades", label: "Grades", desc: "Scores and grades by exam", icon: FileText },
  { key: "fees", label: "Fees", desc: "Fee payments with methods", icon: DollarSign },
  { key: "books", label: "Books", desc: "Library catalogue and stock", icon: Library },
  { key: "apparatus", label: "Science Lab", desc: "Apparatus inventory", icon: FlaskConical },
  { key: "announcements", label: "Announcements", desc: "Broadcast history", icon: Megaphone },
  { key: "exams", label: "Exams", desc: "Exam schedule", icon: CalendarClock },
  { key: "checkouts", label: "Checkouts", desc: "Book checkouts and returns", icon: BookMarked },
];

const ENTITY_FILTERS = ["", "student", "teacher", "class", "attendance", "grade", "exam", "fee_payment", "fee_structure", "announcement", "notification", "school", "user", "book", "checkout", "apparatus", "students"];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<"import" | "export" | "audit">("import");
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [classes, setClasses] = useState<{ id: string; name: string; code: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit log state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsAvailable, setLogsAvailable] = useState<boolean | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const LOGS_PAGE_SIZE = 25;

  useEffect(() => {
    fetch("/api/classes?limit=200")
      .then((r) => r.json())
      .then((data) => setClasses(data.classes || []))
      .catch(() => {});
  }, []);

  // ── Bulk import ─────────────────────────────────────────────────────────────

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setImportError("Please select a CSV file");
      return;
    }

    setImporting(true);
    setImportError("");
    setImported(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (classId) formData.append("classId", classId);
      formData.append("academicYear", academicYear);

      const res = await fetch("/api/students/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImported(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  // ── Audit logs ──────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(logsPage),
        limit: String(LOGS_PAGE_SIZE),
      });
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch audit logs");
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
      setLogsAvailable(data.available ?? true);
    } catch {
      setLogs([]);
      setLogsTotal(0);
      setLogsAvailable(false);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, entityFilter, actionFilter]);

  useEffect(() => {
    if (activeTab !== "audit") return;
    // Deferred so the effect body does not synchronously trigger setState
    const timer = setTimeout(fetchLogs, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchLogs]);

  const totalLogPages = Math.max(1, Math.ceil(logsTotal / LOGS_PAGE_SIZE));

  function parseMetadata(metadata: string | null): string {
    if (!metadata) return "";
    try {
      const parsed = JSON.parse(metadata);
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(", ");
    } catch {
      return metadata;
    }
  }

  const TABS = [
    { key: "import" as const, label: "Bulk Import", icon: Upload },
    { key: "export" as const, label: "Export Data", icon: Download },
    { key: "audit" as const, label: "Audit Logs", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Operations</h1>
        <p className="text-gray-400 text-sm mt-1">
          Bulk data tools, exports and system audit trail
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-surface-2/50 border border-border rounded-2xl w-full max-w-md">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-omix-500 text-white shadow-lg shadow-omix-500/20"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Bulk Import ── */}
      {activeTab === "import" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import form */}
            <div className="glass rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-omix-400" />
                Bulk Import Students
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload a CSV of students. Existing admission numbers are updated; new ones are created.
              </p>

              {importError && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {imported && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-emerald-400 text-sm flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Import complete
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div className="rounded-xl bg-surface-2 p-3">
                      <p className="text-2xl font-bold text-omix-400">{imported.imported}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Created</p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-3">
                      <p className="text-2xl font-bold text-blue-400">{imported.updated}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Updated</p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-3">
                      <p className="text-2xl font-bold text-amber-400">{imported.failed}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Failed</p>
                    </div>
                  </div>
                  {imported.errors.length > 0 && (
                    <div className="mt-4 max-h-40 overflow-y-auto space-y-1">
                      {imported.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-amber-400/80 font-mono">
                          Row {err.row}: {err.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    CSV File
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-border bg-surface-2/50 hover:border-omix-500/40 transition-all flex flex-col items-center gap-2"
                  >
                    <Upload className="w-6 h-6 text-gray-500" />
                    <p className="text-sm text-gray-300">
                      {file ? file.name : "Click to choose a CSV file"}
                    </p>
                    <p className="text-xs text-gray-600">
                      admissionNo, firstName, lastName, gender, dateOfBirth, phone, ...
                    </p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Enroll into Class (optional)
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
                    >
                      <option value="">No class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download endpoint, not navigation */}
                  <a
                    href="/api/students/import/template"
                    className="text-xs text-omix-400 hover:text-omix-300 flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download CSV template
                  </a>
                  <button
                    type="submit"
                    disabled={importing || !file}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import Students
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Import guide */}
            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold text-white mb-4">CSV Format</h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-400">
                  The first row must be the header. Columns in order:
                </p>
                <div className="rounded-xl bg-surface-2 p-4 font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-nowrap">
                  admissionNo, firstName, lastName, gender, dateOfBirth, phone, email, guardianName, guardianPhone, guardianEmail, address, status
                </div>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li><span className="text-gray-300 font-medium">admissionNo</span> — required, unique per school</li>
                  <li><span className="text-gray-300 font-medium">firstName / lastName</span> — required</li>
                  <li><span className="text-gray-300 font-medium">gender</span> — male or female</li>
                  <li><span className="text-gray-300 font-medium">dateOfBirth</span> — YYYY-MM-DD (optional)</li>
                  <li><span className="text-gray-300 font-medium">status</span> — active, graduated or transferred</li>
                  <li>Extra columns are ignored; rows with errors are skipped and reported.</li>
                </ul>
                <div className="pt-2">
                  <p className="text-xs text-gray-600">
                    Tip: download the template, fill it in Excel/Google Sheets, save as CSV, then upload.
                    Up to 2,000 rows per import.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Export ── */}
      {activeTab === "export" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass rounded-2xl p-6 border border-border mb-6">
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-omix-400" />
              Export Data to CSV
            </h2>
            <p className="text-sm text-gray-500">
              Download any module as a CSV file, ready for Excel or Google Sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPORT_ENTITIES.map((entity, idx) => {
              const Icon = entity.icon;
              return (
                <motion.div
                  key={entity.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="glass rounded-2xl p-5 border border-border hover:border-omix-500/20 transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-omix-500/10 flex items-center justify-center ring-1 ring-omix-500/20 flex-shrink-0">
                      <Icon className="w-5 h-5 text-omix-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{entity.label}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{entity.desc}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/export?entity=${entity.key}`}
                    className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-omix-400 hover:border-omix-500/30 transition-all flex-shrink-0"
                    title={`Download ${entity.label} CSV`}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Audit Logs ── */}
      {activeTab === "audit" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {logsAvailable === false ? (
            <div className="glass rounded-2xl p-8 border border-border text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">Audit log storage unavailable</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                The local audit database is not reachable. Make sure{" "}
                <code className="text-omix-400">SQLITE_URL</code> is configured and the local
                schema has been pushed (<code className="text-omix-400">npm run db:push:local</code>).
              </p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 border border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-omix-400" />
                    Audit Trail
                  </h2>
                  <p className="text-sm text-gray-500">{logsTotal} entries</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={entityFilter}
                    onChange={(e) => { setEntityFilter(e.target.value); setLogsPage(1); }}
                    className="px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-gray-200 focus:outline-none input-glow transition-all"
                  >
                    <option value="">All entities</option>
                    {ENTITY_FILTERS.filter((e) => e !== "").map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <select
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setLogsPage(1); }}
                    className="px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-gray-200 focus:outline-none input-glow transition-all"
                  >
                    <option value="">All actions</option>
                    <option value="created">created</option>
                    <option value="updated">updated</option>
                    <option value="deleted">deleted</option>
                    <option value="viewed">viewed</option>
                    <option value="login">login</option>
                    <option value="logout">logout</option>
                    <option value="export">export</option>
                  </select>
                </div>
              </div>

              {logsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-surface-2 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No audit entries found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border text-[10px] uppercase tracking-widest text-gray-500">
                          <th className="pb-3 pr-4 font-bold">Date</th>
                          <th className="pb-3 pr-4 font-bold">Action</th>
                          <th className="pb-3 pr-4 font-bold">Entity</th>
                          <th className="pb-3 pr-4 font-bold">User</th>
                          <th className="pb-3 font-bold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap font-mono">
                              {new Date(log.createdAt).toLocaleString("en-KE", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                                log.action === "created" && "bg-emerald-500/10 text-emerald-400",
                                log.action === "updated" && "bg-blue-500/10 text-blue-400",
                                log.action === "deleted" && "bg-rose-500/10 text-rose-400",
                                log.action === "export" && "bg-purple-500/10 text-purple-400",
                                !["created", "updated", "deleted", "export"].includes(log.action) &&
                                  "bg-surface-2 text-gray-400"
                              )}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-300">{log.entity}</td>
                            <td className="py-3 pr-4 text-xs text-gray-400">{log.userName || "—"}</td>
                            <td className="py-3 text-xs text-gray-500 max-w-[240px] truncate">
                              {parseMetadata(log.metadata) || log.entityId || ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <p className="text-xs text-gray-500">
                      Page {logsPage} of {totalLogPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                        disabled={logsPage <= 1}
                        className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLogsPage((p) => Math.min(totalLogPages, p + 1))}
                        disabled={logsPage >= totalLogPages}
                        className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
