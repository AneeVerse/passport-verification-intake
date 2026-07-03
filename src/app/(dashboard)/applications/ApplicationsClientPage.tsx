"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteApplication, updateApplicationStatus } from "@/app/actions/applications";
import { Eye, Edit2, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

interface Application {
  application_id: number;
  application_date: Date;
  application_srno: string | null;
  application_name: string;
  application_surname: string;
  application_type: number;
  application_mode: number;
  application_mobile: string;
  application_status: number;
  application_bdate: Date;
  application_risk: string;
  office: {
    location_name: string;
  };
}

const STATUS_MAP: Record<number, { text: string; css: string }> = {
  1: { text: "HOLD", css: "bg-red-950/80 text-red-300 border-red-800/50" },
  2: { text: "READY FOR PASSPORT PORTAL", css: "bg-blue-950/80 text-blue-300 border-blue-800/50" },
  3: { text: "APPROVED", css: "bg-emerald-950/80 text-emerald-300 border-emerald-800/50" },
};

const RISK_MAP: Record<string, { text: string; css: string }> = {
  Low: { text: "Low Risk", css: "bg-green-950/80 text-green-300 border-green-800/50" },
  Medium: { text: "Medium Risk", css: "bg-amber-950/80 text-amber-300 border-amber-800/50" },
  High: { text: "High Risk", css: "bg-red-950/80 text-red-300 border-red-800/50" },
};

export default function ApplicationsClientPage({
  initialData,
  totalPages,
  currentPage,
  initialSearch,
  initialStatus,
  userRole,
}: {
  initialData: Application[];
  totalPages: number;
  currentPage: number;
  initialSearch: string;
  initialStatus: string;
  userRole: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery();
  };

  const updateQuery = (newStatus?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const resolvedStatus = newStatus !== undefined ? newStatus : status;
    if (resolvedStatus) params.set("status", resolvedStatus);
    const resolvedPage = newPage !== undefined ? newPage : 1;
    if (resolvedPage > 1) params.set("page", String(resolvedPage));

    router.push(`/applications?${params.toString()}`);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateQuery(newStatus, 1);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this application file?")) {
      startTransition(async () => {
        await deleteApplication(id);
        window.location.reload();
      });
    }
  };

  const handleInlineStatusUpdate = async (id: number, currentStatus: number) => {
    if (userRole !== "Super Admin") {
      alert("Only Supervisors can approve files or manually change verification statuses.");
      return;
    }

    let nextStatus = 1;
    if (currentStatus === 2) {
      nextStatus = 3; // READY -> APPROVED
    } else if (currentStatus === 3) {
      nextStatus = 1; // APPROVED -> HOLD
    } else {
      alert("This file is on HOLD. Modify the application details to complete the required check list first.");
      return;
    }

    startTransition(async () => {
      const res = await updateApplicationStatus(id, nextStatus);
      if (res.success) {
        window.location.reload();
      } else if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Passport Intake Directory</h2>
          <p className="text-sm text-slate-400">Manage client applications, verify documents, and track approval status</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm font-semibold transition border border-slate-700"
          >
            Export CSV
          </a>
          <Link
            href="/applications/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" /> Add Application
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by applicant name, email, mobile or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_MAP).map(([val, info]) => (
              <option key={val} value={val}>
                {info.text}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  SR No
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  CP Office
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Security Risk
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                initialData.map((app) => {
                  const statusInfo = STATUS_MAP[app.application_status] || {
                    text: "Unknown",
                    css: "bg-slate-800 text-slate-400 border-slate-700",
                  };
                  const riskInfo = RISK_MAP[app.application_risk] || {
                    text: "Low Risk",
                    css: "bg-green-950/80 text-green-300 border-green-800/50",
                  };
                  return (
                    <tr key={app.application_id} className="hover:bg-slate-800/25 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-400">
                        #{app.application_srno || String(app.application_id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-slate-200">
                          {app.application_name} {app.application_surname}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{app.application_mobile}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                          {app.application_type === 1 ? "Fresh" : "Reissue"} -{" "}
                          {app.application_mode === 2 ? "Tatkal" : "Normal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {app.office?.location_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${riskInfo.css}`}>
                          {riskInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() =>
                            handleInlineStatusUpdate(app.application_id, app.application_status)
                          }
                          title={
                            userRole === "Super Admin"
                              ? "Click to advance status"
                              : "Supervisor approval required"
                          }
                          disabled={userRole !== "Super Admin" || app.application_status === 1}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.css} ${
                            userRole === "Super Admin" && app.application_status !== 1
                              ? "hover:brightness-110 active:scale-95 transition cursor-pointer"
                              : "cursor-not-allowed"
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-current"
                            style={{ opacity: 0.8 }}
                          />
                          {statusInfo.text}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2 shrink-0 whitespace-nowrap">
                        <Link
                          href={`/applications/${app.application_id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="View Application Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/applications/edit/${app.application_id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="Edit Application"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(app.application_id)}
                          className="inline-flex items-center justify-center p-1.5 rounded bg-red-950/40 border border-red-800/40 text-red-400 hover:text-red-200 hover:bg-red-900/40 transition"
                          title="Delete Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-sm text-slate-400">
            Page <span className="font-semibold text-slate-200">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updateQuery(status, currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => updateQuery(status, currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
