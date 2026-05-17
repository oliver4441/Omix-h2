"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  School, 
  AlertCircle, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Chrome
} from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"credentials" | "magic-link">("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [school, setSchool] = useState<{ name: string; slug: string } | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    const host = window.location.hostname;
    const slug = host.split(".")[0];
    if (slug && slug !== "localhost" && slug !== "www") {
      setSchool({ 
        name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), 
        slug 
      });
    }
  }, []);

  async function handleCredentialsLogin(e: React.FormEvent) {
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
        setError(result?.error === "CredentialsSignin" ? "Invalid email or password" : result?.error || "Login failed");
        setLoading(false);
        return;
      }

      // Successful login — get session to determine role/MFA
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.mfaRequired && !session?.user?.mfaVerified) {
        window.location.href = "/auth/mfa";
        return;
      }

      const role = session?.user?.role as string;
      const dashboard = roleDashboards[role] || "/dashboard";
      window.location.href = callbackUrl || dashboard;
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleMagicLinkLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        callbackUrl: callbackUrl || "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
        setLoading(false);
      } else {
        setLoading(false);
        // Successful - show check email state or something
        setError("success:Check your email for the magic link!");
      }
    } catch (err) {
      setError("An error occurred.");
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: string) {
    setLoading(true);
    await signIn(provider, { callbackUrl: callbackUrl || "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0B]">
      {/* Futuristic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-omix-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-omix-500 to-omix-700 flex items-center justify-center shadow-lg shadow-omix-500/20 ring-1 ring-white/10"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            {school ? school.name : "omixsystems"}
          </h1>
          <p className="text-gray-400 text-sm">Welcome back. Secure access to your SMS.</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl backdrop-blur-2xl">
          {errorParam && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorParam === "AccessDenied" ? "Access denied. Insufficient permissions." : "An authentication error occurred."}</span>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "mb-6 p-4 rounded-xl text-xs flex items-center gap-3 border",
                error.startsWith("success:") 
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" 
                  : "bg-rose-500/5 border-rose-500/10 text-rose-400"
              )}
            >
              {error.startsWith("success:") ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{error.replace("success:", "")}</span>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-all"
              >
                <Chrome className="w-4 h-4" />
                Google
              </button>
              <button
                onClick={() => handleSocialLogin("azure-ad")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-all"
              >
                <img src="https://authjs.dev/img/providers/azure.svg" className="w-4 h-4" alt="Microsoft" />
                Microsoft
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-gray-500">Or continue with</span></div>
            </div>

            {/* Login Method Toggle */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              <button
                onClick={() => setLoginMethod("credentials")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
                  loginMethod === "credentials" ? "bg-omix-500 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Password
              </button>
              <button
                onClick={() => setLoginMethod("magic-link")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
                  loginMethod === "magic-link" ? "bg-omix-500 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Magic Link
              </button>
            </div>

            <AnimatePresence mode="wait">
              {loginMethod === "credentials" ? (
                <motion.form
                  key="credentials"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleCredentialsLogin}
                  className="space-y-4"
                >
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-omix-500/50 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-omix-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-omix-500 hover:bg-omix-400 text-white rounded-xl font-semibold shadow-lg shadow-omix-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="magic-link"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleMagicLinkLogin}
                  className="space-y-4"
                >
                  <p className="text-xs text-gray-500 text-center px-4">
                    Enter your email and we'll send you a secure link to sign in instantly.
                  </p>
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-omix-500/50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-omix-500 hover:bg-omix-400 text-white rounded-xl font-semibold shadow-lg shadow-omix-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Mail className="w-4 h-4" /> Send Link</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">&copy; 2026 omixsystems</p>
          <div className="w-1 h-1 bg-gray-800 rounded-full" />
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Privacy Policy</p>
        </div>
      </motion.div>
    </div>
  );
}
