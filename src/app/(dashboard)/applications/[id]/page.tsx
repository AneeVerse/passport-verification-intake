import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, MapPin, Shield, Calendar, ClipboardList, AlertCircle, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import { auth } from "@/auth";
import ApplicationActions from "./ApplicationActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const GENDER_MAP: Record<number, string> = {
  1: "Male",
  2: "Female",
  3: "Transgender",
};

const SCHEME_MAP: Record<number, string> = {
  1: "Normal",
  2: "Tatkal",
};

const STATUS_MAP: Record<number, { text: string; css: string }> = {
  1: { text: "HOLD", css: "bg-red-950/80 text-red-300 border-red-800/50" },
  2: { text: "READY FOR PASSPORT PORTAL", css: "bg-blue-950/80 text-blue-300 border-blue-800/50" },
  3: { text: "APPROVED", css: "bg-emerald-950/80 text-emerald-300 border-emerald-800/50" },
};

const RISK_MAP: Record<string, { text: string; css: string }> = {
  Low: { text: "Low Risk", css: "bg-green-950/80 text-green-300 border-green-800/50" },
  Medium: { text: "Medium Risk", css: "bg-amber-950/80 text-amber-300 border-amber-800/50" },
  High: { text: "High Risk", css: "bg-red-950/80 text-red-300 border-red-800/50 animate-pulse" },
};

export default async function ViewApplicationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role || "Agent";

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  const app = await prisma.application.findUnique({
    where: { application_id: id },
    include: {
      office: true,
    },
  });

  if (!app) {
    notFound();
  }

  // Retrieve document names for checklists
  const allDocIds = [
    ...(app.application_aproof ? app.application_aproof.split(",") : []),
    ...(app.application_dproof ? app.application_dproof.split(",") : []),
    ...(app.application_addocuments ? app.application_addocuments.split(",") : []),
  ]
    .map((x) => parseInt(x))
    .filter((x) => !isNaN(x) && x !== -1);

  const docs = await prisma.document.findMany({
    where: {
      document_id: { in: allDocIds },
    },
  });

  const getDocName = (idStr: string, otherText: string | null) => {
    if (idStr === "-1") return `Other - ${otherText || ""}`;
    const docId = parseInt(idStr);
    const d = docs.find((x: any) => x.document_id === docId);
    return d ? d.document_name : "-";
  };

  const aproofNames = app.application_aproof ? app.application_aproof.split(",").map((x: string) => getDocName(x, app.application_aother)) : [];
  const dproofNames = app.application_dproof ? app.application_dproof.split(",").map((x: string) => getDocName(x, app.application_dother)) : [];
  const addocNames = app.application_addocuments ? app.application_addocuments.split(",").map((x: string) => getDocName(x, app.application_adother)) : [];

  const statusInfo = STATUS_MAP[app.application_status] || STATUS_MAP[1];
  const riskInfo = RISK_MAP[app.application_risk] || RISK_MAP["Low"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* Header breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link
            href="/applications"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              View Application Details
            </h2>
            <p className="text-sm text-slate-400">
              Details for File #{app.application_srno || String(app.application_id).padStart(3, "0")}
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <ApplicationActions
          applicationId={app.application_id}
          currentStatus={app.application_status}
          userRole={userRole}
        />
      </div>

      {/* Print only header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase text-slate-900">Internal Passport Application Intake Summary</h1>
        <p className="text-sm text-slate-600 mt-1">
          File: #{app.application_srno || String(app.application_id).padStart(3, "0")} | Date: {new Date(app.application_date).toLocaleDateString("en-GB")}
        </p>
      </div>

      {/* Risk and Status Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border flex items-center justify-between bg-slate-900/40 border-slate-800`}>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Intake Status</span>
            <span className="text-md font-bold mt-1 block">{statusInfo.text}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.css}`}>
            {statusInfo.text}
          </span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between bg-slate-900/40 border-slate-800`}>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Security Risk Level</span>
            <span className="text-md font-bold mt-1 block">{riskInfo.text}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskInfo.css}`}>
            {riskInfo.text}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Columns (Applicant Info) */}
        <div className="md:col-span-2 space-y-6">
          {/* Section A: Applicant Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-blue-400" />
              Applicant Profile
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <dt className="text-xs text-slate-400">Full Name</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.application_name} {app.application_surname}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Date of Birth</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">
                  {new Date(app.application_dob).toLocaleDateString("en-GB")} ({app.application_age} years)
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Gender</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{GENDER_MAP[app.application_gender] || "Male"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Mobile Number</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.application_mobile}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Email Address</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.application_email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Marital Status</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">
                  {app.application_mstatus === "2" ? "Married" : app.application_mstatus === "3" ? "Divorced" : app.application_mstatus === "4" ? "Separated" : app.application_mstatus === "5" ? "Widow / Widower" : "Single"}
                </dd>
              </div>
            </div>
          </div>

          {/* Section B: Application parameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Intake Details
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <dt className="text-xs text-slate-400">Applying For</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.application_type === 1 ? "Fresh" : "Reissue"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Type of Scheme</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{SCHEME_MAP[app.application_mode] || "Normal"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">PSK CP Office</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.office?.location_name || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Target Appointment Date</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">
                  {new Date(app.application_bdate).toLocaleDateString("en-GB")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Employment Type</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.application_employment}</dd>
              </div>
              {app.application_employment === "Student" && (
                <div>
                  <dt className="text-xs text-slate-400">Student ID / Enrollment</dt>
                  <dd className="text-sm font-medium text-slate-200 mt-0.5">{app.application_student_id || "N/A"}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Section C: Scenarios / Engine Outputs */}
          {(app.application_type === 2 || app.application_employment === "Government" || app.application_mstatus === "2" || (app.application_type === 1 && app.application_nstatus !== 0)) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Intake Engine Verification Outputs
              </h3>
              <div className="space-y-4">
                {/* Reissue Info */}
                {app.application_type === 2 && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Reissue Validation</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-xs text-slate-500">Reason for Reissue:</span>
                        <span className="text-sm font-medium text-slate-300 block">{app.application_reissue_reason || "-"}</span>
                      </div>
                      {app.application_reissue_reason === "Lost" && (
                        <div>
                          <span className="text-xs text-slate-500">Lost Confirmations:</span>
                          <span className="text-sm font-medium text-slate-300 block">
                            FIR: {app.application_fir_uploaded ? "Uploaded & Verified" : "Missing"} | Affidavit: {app.application_affidavit_confirm ? "Verified" : "Missing"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fresh Nationality */}
                {app.application_type === 1 && app.application_nstatus !== 0 && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Fresh Nationality Proof Checks</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {app.application_nstatus === 1 && (
                        <div>
                          <span className="text-xs text-slate-500">Required Parent Proof:</span>
                          <span className="text-sm font-medium text-slate-300 block">
                            {app.application_nproof === "-1" ? `Other: ${app.application_nother}` : app.application_nproof}
                          </span>
                        </div>
                      )}
                      {app.application_nstatus === 2 && (
                        <>
                          <div>
                            <span className="text-xs text-slate-500">Mother Proof:</span>
                            <span className="text-sm font-medium text-slate-300 block">
                              {app.application_mnproof === "-1" ? `Other: ${app.application_mnother}` : app.application_mnproof}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Father Proof:</span>
                            <span className="text-sm font-medium text-slate-300 block">
                              {app.application_fnproof === "-1" ? `Other: ${app.application_fnother}` : app.application_fnproof}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Government Employee */}
                {app.application_employment === "Government" && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Government NOC & Identity Certificates</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-xs text-slate-500">NOC Checked & Verified:</span>
                        <span className="text-sm font-semibold text-emerald-400 block">{app.application_noc_confirm ? "Yes" : "No"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Identity Certificate Verified:</span>
                        <span className="text-sm font-semibold text-emerald-400 block">{app.application_ic_confirm ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Married details */}
                {app.application_mstatus === "2" && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Marriage Proof Option</span>
                    <div className="mt-1">
                      <span className="text-sm font-medium text-slate-300 block">{app.application_mproof_option || "None Selected"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section D: Spelling Checks and Remarks */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Spelling & Document Consistency Verification
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block">Name same on all docs?</span>
                  <span className={`text-sm font-bold block mt-1 ${app.application_name_spelling_same ? 'text-emerald-400' : 'text-red-400'}`}>
                    {app.application_name_spelling_same ? 'Yes' : 'No'}
                  </span>
                  {!app.application_name_spelling_same && (
                    <span className="text-xs text-slate-300 block mt-2 italic">
                      Remark: {app.application_name_mismatch_remark}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block">Address same on all docs?</span>
                  <span className={`text-sm font-bold block mt-1 ${app.application_address_same ? 'text-emerald-400' : 'text-red-400'}`}>
                    {app.application_address_same ? 'Yes' : 'No'}
                  </span>
                  {!app.application_address_same && (
                    <span className="text-xs text-slate-300 block mt-2 italic">
                      Remark: {app.application_address_remark}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <dt className="text-xs text-slate-400">Past Criminal Cases registered?</dt>
                <dd className={`text-sm font-semibold mt-0.5 ${app.application_criminal_case ? 'text-red-400' : 'text-slate-300'}`}>
                  {app.application_criminal_case ? 'YES - Past criminal record exists' : 'NO'}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-400">Office Notes & Instructions</dt>
                <dd className="text-sm text-slate-300 mt-1 italic p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                  {app.application_notes || "No extra remarks provided."}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Checklists & Verification Details) */}
        <div className="space-y-6">
          {/* Staff Verification Checklist Badge */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Staff Verification checklist
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <span className={`p-0.5 rounded-full ${app.application_verify_name ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className={app.application_verify_name ? 'text-slate-200' : 'text-slate-500'}>Name spelling verified</span>
              </li>

              <li className="flex items-center gap-2 text-sm">
                <span className={`p-0.5 rounded-full ${app.application_verify_dob ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className={app.application_verify_dob ? 'text-slate-200' : 'text-slate-500'}>Date of birth verified</span>
              </li>

              <li className="flex items-center gap-2 text-sm">
                <span className={`p-0.5 rounded-full ${app.application_verify_address ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className={app.application_verify_address ? 'text-slate-200' : 'text-slate-500'}>Address matches proofs</span>
              </li>

              <li className="flex items-center gap-2 text-sm">
                <span className={`p-0.5 rounded-full ${app.application_verify_originals ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className={app.application_verify_originals ? 'text-slate-200' : 'text-slate-500'}>All originals seen physically</span>
              </li>

              {app.application_type === 1 && app.application_nstatus !== 0 && (
                <li className="flex items-center gap-2 text-sm">
                  <span className={`p-0.5 rounded-full ${app.application_verify_nationality ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className={app.application_verify_nationality ? 'text-slate-200' : 'text-slate-500'}>Parent nationality verified</span>
                </li>
              )}
            </ul>
          </div>

          {/* Documents Carried Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <ClipboardList className="w-4 h-4 text-blue-400" />
              Documents checklist
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Proof of Address
                </h4>
                <ul className="space-y-1 pl-4 list-disc text-sm text-slate-300">
                  {aproofNames.map((n: string, i: number) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Proof of Date of Birth
                </h4>
                <ul className="space-y-1 pl-4 list-disc text-sm text-slate-300">
                  {dproofNames.map((n: string, i: number) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              {addocNames.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Additional Documents
                  </h4>
                  <ul className="space-y-1 pl-4 list-disc text-sm text-slate-300">
                    {addocNames.map((n: string, i: number) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
