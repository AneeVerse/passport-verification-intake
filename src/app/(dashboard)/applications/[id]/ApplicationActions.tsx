"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/app/actions/applications";
import { Printer, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApplicationActions({
  applicationId,
  currentStatus,
  userRole,
}: {
  applicationId: number;
  currentStatus: number;
  userRole: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = (newStatus: number) => {
    startTransition(async () => {
      const res = await updateApplicationStatus(applicationId, newStatus);
      if (res.success) {
        router.refresh();
      } else if (res.error) {
        alert(res.error);
      }
    });
  };

  const isSupervisor = userRole === "Super Admin";

  return (
    <div className="flex flex-wrap items-center gap-3 no-print">
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm font-semibold transition border border-slate-700 shadow-sm"
      >
        <Printer className="w-4 h-4" /> Print PDF Summary
      </button>

      {currentStatus === 2 && (
        <>
          {isSupervisor ? (
            <button
              onClick={() => handleStatusChange(3)}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Approve Application (Supervisor)
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-amber-400 rounded-lg text-sm font-semibold">
              <ShieldAlert className="w-4 h-4" /> Waiting for Supervisor Approval
            </div>
          )}
        </>
      )}

      {currentStatus === 3 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 rounded-lg text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Approved by Supervisor
        </div>
      )}

      {isSupervisor && currentStatus === 3 && (
        <button
          onClick={() => handleStatusChange(1)}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-300 font-medium ml-2 underline underline-offset-4"
        >
          Revert to HOLD
        </button>
      )}
    </div>
  );
}
