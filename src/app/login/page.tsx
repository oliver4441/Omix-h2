"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, GraduationCap, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<{ name: string; slug: string } | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    // Detect school context from cookie set by middleware
    const cookies = document.cookie.split("; ");
    const schoolCookie = cookies.find((c) => c.startsWith("x-school-slug="));
    const slug = schoolCookie?.split("=")[1];
    if (slug) {
      // Show school name in UI
      const names: Record<string, string> = {
        demo: "Omix Demo Academy",
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
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  const errorParam = searchParams.get("error");

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
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold gradient-text"
          >
            omixsystems
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mt-2 text-sm"
          >
            School Management Platform
          </motion.p>
        </div>

        {/* School Info Banner */}
        {school && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-omix-500/10 border border-omix-500/20 rounded-xl flex items-center gap-3"
          >
            <Building2 className="w-5 h-5 text-omix-400 shrink-0" />
            <div className="text-sm">
              <span className="text-gray-400">Signing in to </span>
              <span className="text-omix-300 font-medium">{school.name}</span>
            </div>
          </motion.div>
        )}

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8 glow"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-omix-400" />
            <span className="text-sm text-gray-400">Sign in to continue</span>
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

            {(error || errorParam) && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
              >
                {error || (errorParam === "CredentialsSignin" ? "Invalid email or password" : "Authentication error")}
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

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <p className="text-xs text-gray-500 text-center">
              Powered by <span className="text-omix-400">omixsystems</span> AI
            </p>
            {!school && (
              <p className="text-xs text-gray-500 text-center">
                <Link href="/register" className="text-omix-400 hover:text-omix-300 transition-colors">
                  Don&apos;t have an account? Register your school
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
