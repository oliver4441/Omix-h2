"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, School, AlertCircle } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const roleDashboards: Record<string, string> = {
  super_admin: "/admin",
  school_admin: "/principal/dashboard",
  bursar: "/bursar/dashboard",
  librarian: "/library/dashboard",
  lab_technician: "/science-lab/dashboard",
  computer_lab: "/computer-lab/dashboard",
  board_member: "/board/dashboard",
  department_head: "/departments/dashboard",
  teacher: "/dashboard",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "Principal / School Admin",
  bursar: "Bursar's Office",
  librarian: "Library",
  lab_technician: "Science Lab",
  computer_lab: "Computer Lab",
  board_member: "Board of Management",
  department_head: "Department Head",
  teacher: "Teacher",
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-omix-500/30 border-t-omix-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const params = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [school, setSchool] = useState<{ name: string; slug: string } | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    // Detect school from subdomain
    const host = window.location.hostname;
    const slug = host.split(".")[0];
    if (slug && slug !== "localhost" && slug !== "www") {
      const names: Record<string, string> = {
        omix: "Omix Systems",
        demo: "Demo School",
      };
      setSchool({ name: names[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), slug });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        schoolSlug: school?.slug || "",
        redirect: false,
      });

      if (!result || result?.error) {
        setError(
          result?.error === "CredentialsSignin"
            ? "Invalid email or password"
            : "Login failed. Please check your credentials."
        );
        setLoading(false);
        return;
      }

      // Successful login — get session to determine role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role) {
        const role = session.user.role as string;
        const dashboard = roleDashboards[role] || "/dashboard";
        window.location.href = callbackUrl || dashboard;
      } else {
        window.location.href = callbackUrl || "/dashboard";
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  const showSchoolSelector = !school;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-omix-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* School header */}
        {school && (
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-omix-500 to-purple-600 flex items-center justify-center shadow-lg shadow-omix-500/25"
            >
              <School className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold gradient-text">{school.name}</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
          </div>
        )}

        <div className="glass rounded-2xl p-8 border border-border shadow-xl">
          {errorParam === "AccessDenied" && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Access denied. Your account may not have permission for this area.</span>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-omix-500 to-purple-600 hover:from-omix-400 hover:to-purple-500 text-white",
                "shadow-lg shadow-omix-500/25 hover:shadow-omix-500/40",
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
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>

            {/* Role hint */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-gray-500 text-center">
                You will be redirected to your role-specific dashboard after signing in
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} Omix Systems. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
