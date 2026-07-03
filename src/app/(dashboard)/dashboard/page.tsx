import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, CheckCircle2, Calendar, AlertTriangle, ArrowRight, UserCheck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalApps, feePaidApps, bookedApps, onHoldApps, recentApps] = await Promise.all([
    prisma.application.count({ where: { application_trash: 1 } }),
    prisma.application.count({ where: { application_status: 2, application_trash: 1 } }),
    prisma.application.count({ where: { application_status: 3, application_trash: 1 } }),
    prisma.application.count({ where: { application_status: 8, application_trash: 1 } }),
    prisma.application.findMany({
      where: { application_trash: 1 },
      include: { office: true },
      orderBy: { application_id: "desc" },
      take: 5,
    }),
  ]);

  const cards = [
    {
      name: "Total Active",
      value: totalApps,
      icon: FileText,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    },
    {
      name: "Fee Paid",
      value: feePaidApps,
      icon: CheckCircle2,
      color: "from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30",
    },
    {
      name: "Appointment Booked",
      value: bookedApps,
      icon: Calendar,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
    {
      name: "On Hold",
      value: onHoldApps,
      icon: AlertTriangle,
      color: "from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard</h2>
        <p className="text-sm text-slate-400">Overview of client applications and processing status</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className={`bg-gradient-to-br ${card.color} border p-6 rounded-2xl shadow-xl flex items-center justify-between transition hover:scale-[1.02]`}
            >
              <div>
                <p className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
                  {card.name}
                </p>
                <p className="text-3xl font-extrabold text-slate-100 mt-2">{card.value}</p>
              </div>
              <div className="p-3 bg-slate-950/40 rounded-xl">
                <Icon className="w-8 h-8" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Applications table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">Recently Added Applications</h3>
          <Link
            href="/applications"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase">SR No</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase">Name</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase">Type</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase">Location</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase">Appt Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No applications added yet.
                  </td>
                </tr>
              ) : (
                recentApps.map((app) => (
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
                      <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {app.application_type === 1 ? "Fresh" : "Reissue"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {app.office?.location_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {app.application_bdate
                        ? new Date(app.application_bdate).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
