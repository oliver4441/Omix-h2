"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  AlertTriangle,
  Beaker,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
export const dynamic = 'force-dynamic';

interface Apparatus {
  id: string;
  name: string;
  quantity: number;
  available: number;
  condition: "good" | "needs_repair" | "broken";
  category: string;
}

interface StockAlert {
  id: string;
  item: string;
  type: "low_stock" | "broken" | "expired";
  message: string;
  severity: "low" | "medium" | "high";
}

export default function ScienceLabDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalApparatus: number;
    inUse: number;
    needsRepair: number;
    lowStock: number;
  } | null>(null);
  const [apparatusList, setApparatusList] = useState<Apparatus[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);
  async function fetchDashboard() {
    try {
      setLoading(true);
      const [statsRes, apparatusRes] = await Promise.all([
        fetch("/api/science-lab/stats"),
        fetch("/api/science-lab/apparatus"),
      ]);

      if (!statsRes.ok || !apparatusRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsData = await statsRes.json();
      const apparatusData = await apparatusRes.json();

      setStats({
        totalApparatus: statsData.totalApparatus || 0,
        inUse: statsData.totalAvailable || 0,
        needsRepair: statsData.totalBroken || 0,
        lowStock: statsData.lowStockItems?.length || 0,
      });
      setApparatusList([
        {
          id: "a1",
          name: "Microscope (BX-43)",
          quantity: 25,
          available: 18,
          condition: "good",
          category: "Optics",
        },
        {
          id: "a2",
          name: "Bunsen Burner",
          quantity: 40,
          available: 32,
          condition: "needs_repair",
          category: "Heating",
        },
        {
          id: "a3",
          name: "Graduated Cylinder (100ml)",
          quantity: 60,
          available: 45,
          condition: "good",
          category: "Glassware",
        },
        {
          id: "a4",
          name: "pH Meter",
          quantity: 15,
          available: 10,
          condition: "broken",
          category: "Measuring",
        },
        {
          id: "a5",
          name: "Beaker (250ml)",
          quantity: 80,
          available: 62,
          condition: "good",
          category: "Glassware",
        },
        {
          id: "a6",
          name: "Thermometer (-10-110°C)",
          quantity: 30,
          available: 22,
          condition: "needs_repair",
          category: "Measuring",
        },
      ]);
      setAlerts([
        {
          id: "al1",
          item: "Microscope slides",
          type: "low_stock",
          message: "Only 12 microscope slides remaining. Reorder soon.",
          severity: "high",
        },
        {
          id: "al2",
          item: "pH Meter (Unit #7)",
          type: "broken",
          message: "pH Meter reading is inaccurate. Needs calibration or replacement.",
          severity: "medium",
        },
        {
          id: "al3",
          item: "Sulfuric Acid (2M)",
          type: "expired",
          message: "Expired chemical stock detected. Dispose safely and reorder.",
          severity: "high",
        },
        {
          id: "al4",
          item: "Bunsen Burner (Unit #12)",
          type: "broken",
          message: "Gas valve is stuck. Repair required before next practical session.",
          severity: "medium",
        },
        {
          id: "al5",
          item: "Litmus Paper",
          type: "low_stock",
          message: "Only 3 packs of litmus paper left.",
          severity: "low",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const apparatusColumns = [
    { key: "name", header: "Apparatus", sortable: true },
    { key: "category", header: "Category", sortable: true },
    {
      key: "quantity",
      header: "Total",
      sortable: true,
      className: "text-center",
    },
    {
      key: "available",
      header: "Available",
      sortable: true,
      className: "text-center",
      render: (item: Apparatus) => (
        <span
          className={cn(
            "font-medium",
            item.available === 0
              ? "text-red-400"
              : item.available < item.quantity * 0.3
              ? "text-amber-400"
              : "text-emerald-400"
          )}
        >
          {item.available}
        </span>
      ),
    },
    {
      key: "condition",
      header: "Condition",
      sortable: true,
      render: (item: Apparatus) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            item.condition === "good"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : item.condition === "needs_repair"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          )}
        >
          {item.condition === "needs_repair"
            ? "Needs Repair"
            : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
        </span>
      ),
    },
  ];

  const severityColors = {
    low: "border-blue-500/20 bg-blue-500/5",
    medium: "border-amber-500/20 bg-amber-500/5",
    high: "border-red-500/20 bg-red-500/5",
  };

  const severityText = {
    low: "text-blue-400",
    medium: "text-amber-400",
    high: "text-red-400",
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-2 rounded-2xl animate-pulse" />
          <div className="h-64 bg-surface-2 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-6 py-2 bg-omix-500/20 border border-omix-500/30 rounded-xl text-omix-400 hover:bg-omix-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

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
            Science Lab Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Apparatus inventory, maintenance alerts, and lab activity
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm text-sm">
          <Plus className="w-4 h-4" />
          Add Apparatus
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
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Total Apparatus"
            value={stats.totalApparatus}
            icon={FlaskConical}
            color="omix"
            trend={{ value: 5, positive: true }}
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Currently In Use"
            value={stats.inUse}
            icon={Beaker}
            color="blue"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Needs Repair"
            value={stats.needsRepair}
            icon={Wrench}
            color="amber"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            title="Low Stock Items"
            value={stats.lowStock}
            icon={AlertTriangle}
            color="rose"
            trend={{ value: 2, positive: false }}
          />
        </motion.div>
      </motion.div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">
              Alerts &amp; Notifications
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08 }}
                className={cn(
                  "glass rounded-2xl p-5 border",
                  severityColors[alert.severity]
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      alert.severity === "high"
                        ? "bg-red-500/10"
                        : alert.severity === "medium"
                        ? "bg-amber-500/10"
                        : "bg-blue-500/10"
                    )}
                  >
                    <AlertTriangle
                      className={cn("w-5 h-5", severityText[alert.severity])}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-200 mb-1">
                      {alert.item}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {alert.message}
                    </p>
                    <span
                      className={cn(
                        "inline-block mt-2 text-[10px] font-medium uppercase tracking-wider",
                        severityText[alert.severity]
                      )}
                    >
                      {alert.severity} priority
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Apparatus Inventory */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Apparatus Inventory
          </h2>
          <button className="flex items-center gap-1 text-sm text-omix-400 hover:text-omix-300 transition-colors">
            Manage Inventory <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <DataTable
          columns={apparatusColumns}
          data={apparatusList}
          searchable
          searchKeys={["name", "category"]}
          pageSize={5}
          emptyMessage="No apparatus in inventory"
        />
      </motion.div>

      {/* Empty state */}
      {apparatusList.length === 0 && alerts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Lab Inventory Empty
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Add your first apparatus or equipment to start tracking lab
            inventory and maintenance.
          </p>
        </motion.div>
      )}
    </div>
  );
}
