"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  User, Mail, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountSettings() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const role = (session?.user as any)?.role || "";
  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    school_admin: "Principal / Admin",
    bursar: "Bursar",
    librarian: "Librarian",
    lab_technician: "Lab Technician",
    computer_lab: "Computer Lab",
    board_member: "Board Member",
    department_head: "Department Head",
    teacher: "Teacher",
  };

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/department/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      await update({ name, email });
      setSuccess("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/department/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account credentials and preferences</p>
      </div>

      {/* Success / Error messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Account info card */}
      <div className="glass rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-omix-400" />
          Account Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-surface-2 rounded-xl">
            <span className="text-gray-500">Role</span>
            <p className="text-gray-200 font-medium mt-1">{roleLabel[role] || role}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-xl">
            <span className="text-gray-500">Email</span>
            <p className="text-gray-200 font-medium mt-1">{session?.user?.email}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-xl">
            <span className="text-gray-500">Name</span>
            <p className="text-gray-200 font-medium mt-1">{session?.user?.name || "Not set"}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-xl">
            <span className="text-gray-500">School</span>
            <p className="text-gray-200 font-medium mt-1">{(session as any)?.user?.schoolName || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Update Profile */}
      <div className="glass rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-omix-400" />
          Update Profile
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
              "bg-gradient-to-r from-omix-500 to-purple-600 hover:from-omix-400 hover:to-purple-500 text-white",
              "shadow-lg shadow-omix-500/25",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-omix-400" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
              "bg-gradient-to-r from-omix-500 to-purple-600 hover:from-omix-400 hover:to-purple-500 text-white",
              "shadow-lg shadow-omix-500/25",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
