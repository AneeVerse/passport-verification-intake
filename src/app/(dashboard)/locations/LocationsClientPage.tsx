"use client";

import { useState, useTransition } from "react";
import { addLocation, updateLocation, toggleLocationStatus } from "@/app/actions/locations";
import { Edit2, Ban, CheckCircle2, Plus, ArrowRight, RefreshCw } from "lucide-react";

interface Location {
  location_id: number;
  location_name: string;
  location_added_on: string | null;
  location_status: number;
}

export default function LocationsClientPage({
  initialLocations,
}: {
  initialLocations: Location[];
}) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    startTransition(async () => {
      const res = await toggleLocationStatus(id, currentStatus);
      if (res.success) {
        setLocations((prev) =>
          prev.map((loc) =>
            loc.location_id === id
              ? { ...loc, location_status: currentStatus === 1 ? 0 : 1 }
              : loc
          )
        );
        setSuccess(res.success);
        setError(null);
      }
    });
  };

  const handleEditClick = (loc: Location) => {
    setEditingId(loc.location_id);
    setInputValue(loc.location_name);
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInputValue("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateLocation(editingId, formData);
        if (res.success) {
          setLocations((prev) =>
            prev.map((loc) =>
              loc.location_id === editingId ? { ...loc, location_name: inputValue } : loc
            )
          );
          setEditingId(null);
          setInputValue("");
          setSuccess(res.success);
        } else if (res.error) {
          setError(res.error);
        }
      } else {
        res = await addLocation(formData);
        if (res.success) {
          // Re-fetch or append manually. For simplicity, we trigger reload or fetch the latest since it's a dashboard.
          // Since we revalidatePath in the server action, window.location.reload() or router.refresh() updates.
          // Let's just update local state by inserting a placeholder or reloading.
          setInputValue("");
          setSuccess(res.success);
          window.location.reload();
        } else if (res.error) {
          setError(res.error);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Locations</h2>
          <p className="text-sm text-slate-400">
            Manage Passport Seva Kendra (PSK) appointment locations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              {editingId ? "Edit Location" : "Add New Location"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm font-semibold text-red-400 bg-red-950/20 border border-red-800/40 p-3 rounded-lg">{error}</div>}
              {success && <div className="text-sm font-semibold text-green-400 bg-green-950/20 border border-green-800/40 p-3 rounded-lg">{success}</div>}

              <div>
                <label htmlFor="location_name" className="block text-sm font-medium text-slate-300 mb-1">
                  Location Name
                </label>
                <input
                  id="location_name"
                  name="location_name"
                  type="text"
                  required
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. Mumbai PSK"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                  {isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2 px-4 border border-slate-800 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200">Active PSK Locations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Location Name
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Added On
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
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                        No locations added yet.
                      </td>
                    </tr>
                  ) : (
                    locations.map((loc) => (
                      <tr key={loc.location_id} className="hover:bg-slate-800/25 transition">
                        <td className="px-6 py-4 text-sm font-medium text-slate-200">
                          {loc.location_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {loc.location_added_on
                            ? new Date(loc.location_added_on).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              loc.location_status === 1
                                ? "bg-green-950/80 text-green-300 border-green-800/50"
                                : "bg-red-950/80 text-red-300 border-red-800/50"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                loc.location_status === 1 ? "bg-green-400" : "bg-red-400"
                              }`}
                            />
                            {loc.location_status === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(loc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(loc.location_id, loc.location_status)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border transition text-xs ${
                              loc.location_status === 1
                                ? "bg-red-950/40 text-red-400 border-red-800/30 hover:bg-red-900/40 hover:text-red-200"
                                : "bg-green-950/40 text-green-400 border-green-800/30 hover:bg-green-900/40 hover:text-green-200"
                            }`}
                          >
                            {loc.location_status === 1 ? (
                              <>
                                <Ban className="w-3.5 h-3.5" /> Disable
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Enable
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
