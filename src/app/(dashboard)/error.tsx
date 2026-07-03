"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="p-4 bg-red-950/30 rounded-full border border-red-800/40">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-200">Something went wrong</h2>
      <p className="text-sm text-slate-400 max-w-md text-center">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}
