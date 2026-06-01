"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass rounded-2xl p-8 max-w-md text-center glow-sm">
        <div className="w-16 h-16 rounded-xl bg-omix-500/10 border border-omix-500/20 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-omix-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Page not found</h2>
        <p className="text-sm text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-omix-500/10 border border-omix-500/20 text-omix-400 text-sm font-medium hover:bg-omix-500/20 transition-all"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
