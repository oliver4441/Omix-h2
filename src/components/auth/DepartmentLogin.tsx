"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";

interface DepartmentLoginProps {
  department: string;
  departmentName: string;
  requiredRole: string;
  icon: React.ReactNode;
  dashboardPath: string;
}

export default function DepartmentLogin({
  department,
  departmentName,
  requiredRole,
  icon,
  dashboardPath,
}: DepartmentLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        schoolSlug: "",
        redirect: false,
        callbackUrl: dashboardPath,
      });

      if (!result || result?.error) {
        setError(result?.error === "CredentialsSignin" ? "Invalid email or password" : "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Verify the user's role matches this department
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role !== requiredRole && session?.user?.role !== "super_admin" && session?.user?.role !== "school_admin") {
        setError(`This account does not have ${departmentName} access. Please use the correct login portal.`);
        setLoading(false);
        return;
      }

      window.location.href = dashboardPath;
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-omix-500 to-omix-700 mb-6 glow"
          >
            {icon}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold gradient-text"
          >
            {departmentName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mt-2 text-sm"
          >
            omixsystems — {department}
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8 glow"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-400">Sign in to {departmentName}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none input-glow transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-sm"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-gray-500">
              <a href="/login" className="text-omix-400 hover:text-omix-300 transition-colors">
                Back to main login
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
