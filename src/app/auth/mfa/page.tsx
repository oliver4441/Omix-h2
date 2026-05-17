"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, AlertCircle, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function MFAPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        // MFA Verified - redirect to dashboard
        router.refresh();
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Invalid verification code");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0B]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-omix-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl backdrop-blur-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-omix-500/10 flex items-center justify-center ring-1 ring-omix-500/20">
            <ShieldCheck className="w-8 h-8 text-omix-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Two-Step Verification</h1>
          <p className="text-gray-400 text-sm mb-8">
            Enter the 6-digit code from your authenticator app to complete your sign-in.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center tracking-[1em] text-2xl font-mono px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-omix-500/50 transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className={cn(
                "w-full py-4 bg-omix-500 hover:bg-omix-400 text-white rounded-2xl font-semibold shadow-lg shadow-omix-500/20 transition-all flex items-center justify-center gap-2",
                (loading || code.length !== 6) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => window.location.href = "/login"}
            className="mt-8 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel and return to login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
