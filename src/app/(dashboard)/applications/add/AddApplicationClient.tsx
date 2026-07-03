"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addApplication } from "@/app/actions/applications";
import { Loader2, ArrowLeft, AlertCircle, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface Location {
  location_id: number;
  location_name: string;
}

interface Document {
  document_id: number;
  document_name: string;
  document_category: number;
}

export default function AddApplicationClient({
  locations,
  addressDocs,
  dobDocs,
  additionalDocs,
}: {
  locations: Location[];
  addressDocs: Document[];
  dobDocs: Document[];
  additionalDocs: Document[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Core Form States
  const [appType, setAppType] = useState("1"); // 1: Fresh, 2: Reissue
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [employmentType, setEmploymentType] = useState("Not Employed");
  const [maritalStatus, setMaritalStatus] = useState("1"); // 1: Single, 2: Married, etc.
  const [scheme, setScheme] = useState("1"); // 1: Normal, 2: Tatkal

  // Reissue spec states
  const [reissueReason, setReissueReason] = useState("");
  const [firUploaded, setFirUploaded] = useState(false);
  const [affidavitConfirm, setAffidavitConfirm] = useState(false);

  // Employment spec states
  const [studentId, setStudentId] = useState("");
  const [nocConfirm, setNocConfirm] = useState(false);
  const [icConfirm, setIcConfirm] = useState(false);

  // Marital spec states
  const [mproofOption, setMproofOption] = useState("");

  // Name & Address spelling validation states
  const [nameSame, setNameSame] = useState(true);
  const [nameRemark, setNameRemark] = useState("");
  const [addressSame, setAddressSame] = useState(true);
  const [addressRemark, setAddressRemark] = useState("");

  // Checkbox Document checklists
  const [aproofSelected, setAproofSelected] = useState<string[]>([]);
  const [dproofSelected, setDproofSelected] = useState<string[]>([]);
  const [addocSelected, setAddocSelected] = useState<string[]>([]);

  // Verification Checklist states
  const [verifyName, setVerifyName] = useState(false);
  const [verifyDob, setVerifyDob] = useState(false);
  const [verifyAddress, setVerifyAddress] = useState(false);
  const [verifyNationality, setVerifyNationality] = useState(false);
  const [verifyOriginals, setVerifyOriginals] = useState(false);

  // Declarations
  const [criminalCase, setCriminalCase] = useState(false);

  // Calculated variables
  const isMinor = typeof age === "number" && age < 18;
  const isInfant = typeof age === "number" && age < 4;
  const isFresh = appType === "1";
  const isReissue = appType === "2";
  const isMarried = maritalStatus === "2";
  const isGovtEmployee = employmentType === "Government";

  // Nationality cutoff calculation
  const [requiresNationalityProof, setRequiresNationalityProof] = useState(false);
  const [nationalityStatus, setNationalityStatus] = useState<number | null>(null);
  const [nProof, setNProof] = useState("");
  const [mnProof, setMnProof] = useState("");
  const [fnProof, setFnProof] = useState("");

  useEffect(() => {
    if (!dob || !isFresh) {
      setRequiresNationalityProof(false);
      setNationalityStatus(null);
      return;
    }

    const birthDate = new Date(dob);
    const dobTime = birthDate.getTime();
    const singleParentCutoff = new Date(1987, 6, 1).getTime(); // July 1, 1987
    const bothParentsCutoff = new Date(2004, 11, 3).getTime(); // Dec 3, 2004

    if (dobTime < singleParentCutoff) {
      setRequiresNationalityProof(false);
      setNationalityStatus(0);
    } else {
      setRequiresNationalityProof(true);
      const isBoth = dobTime >= bothParentsCutoff;
      setNationalityStatus(isBoth ? 2 : 1);
    }
  }, [dob, isFresh]);

  // Calculate age
  useEffect(() => {
    if (!dob) {
      setAge("");
      return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    setAge(computedAge >= 0 ? computedAge : 0);
  }, [dob]);

  const handleCheckboxChange = (
    val: string,
    state: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (state.includes(val)) {
      setState(state.filter((x) => x !== val));
    } else {
      setState([...state, val]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Basic Checklist Validations
    if (aproofSelected.length === 0) {
      setError("Please select at least one Proof of Address.");
      return;
    }
    if (dproofSelected.length === 0) {
      setError("Please select at least one Proof of Date of Birth.");
      return;
    }

    // Name spelling validation
    if (!nameSame && !nameRemark.trim()) {
      setError("Please specify a remark for Name Spelling mismatch.");
      return;
    }

    // Address same validation
    if (!addressSame && !addressRemark.trim()) {
      setError("Please specify a remark for Address mismatch.");
      return;
    }

    // Reissue lost verification
    if (isReissue && reissueReason === "Lost") {
      if (!firUploaded || !affidavitConfirm) {
        setError("For Lost Passports, you must confirm FIR upload and Affidavit verification.");
        return;
      }
      if (!addocSelected.includes("26")) {
        setError("For Lost Passports, you must check 'FIR Copy' in Additional Documents.");
        return;
      }
    }

    // Government employee validations
    if (isGovtEmployee && (!nocConfirm || !icConfirm)) {
      setError("For Government Employees, you must confirm NOC and Identity Certificate verification.");
      return;
    }

    // Student ID validations
    if (employmentType === "Student" && !studentId.trim()) {
      setError("Please enter the Student ID number.");
      return;
    }

    // Minor Annexure check
    if (isMinor && !addocSelected.includes("17")) {
      setError("For Minor applicants, you must select 'Annexure H' in Additional Documents.");
      return;
    }

    // Infant Photo check
    if (isInfant && !addocSelected.includes("21")) {
      setError("For Infant applicants (Age < 4), you must select '2 Photos (<4 Years)' in Additional Documents.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // Explicitly append boolean and custom computed fields
    formData.set("application_fir_uploaded", String(firUploaded));
    formData.set("application_affidavit_confirm", String(affidavitConfirm));
    formData.set("application_noc_confirm", String(nocConfirm));
    formData.set("application_ic_confirm", String(icConfirm));
    formData.set("application_name_spelling_same", String(nameSame));
    formData.set("application_name_mismatch_remark", nameRemark);
    formData.set("application_address_same", String(addressSame));
    formData.set("application_address_remark", addressRemark);
    
    formData.set("application_verify_name", String(verifyName));
    formData.set("application_verify_dob", String(verifyDob));
    formData.set("application_verify_nationality", String(verifyNationality));
    formData.set("application_verify_address", String(verifyAddress));
    formData.set("application_verify_originals", String(verifyOriginals));
    formData.set("application_criminal_case", String(criminalCase));

    startTransition(async () => {
      try {
        const res = await addApplication(formData);
        if (res.success) {
          router.push("/applications");
          router.refresh();
        } else if (res.error) {
          setError(res.error);
        }
      } catch (err: any) {
        setError("An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header breadcrumbs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <Link
          href="/applications"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Add Passport Intake File</h2>
          <p className="text-sm text-slate-400">Fill in client details and run document checklist verification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {error && (
          <div className="rounded-lg bg-red-950/50 border border-red-800/60 p-4 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">{error}</div>
          </div>
        )}

        {/* Section 1: Core Intake details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-blue-400" /> Basic Applicant Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="application_date"
                required
                defaultValue={new Date().toISOString().substring(0, 10)}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Application Type <span className="text-red-500">*</span>
              </label>
              <select
                name="application_type"
                required
                value={appType}
                onChange={(e) => setAppType(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Fresh</option>
                <option value="2">Reissue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Scheme <span className="text-red-500">*</span>
              </label>
              <select
                name="application_mode"
                required
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Normal</option>
                <option value="2">Tatkal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Applicant Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="application_name"
                required
                placeholder="First + Middle Name"
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Surname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="application_surname"
                required
                placeholder="Surname"
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="application_gender"
                required
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Male</option>
                <option value="2">Female</option>
                <option value="3">Transgender</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="application_mobile"
                required
                placeholder="10 digit number"
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="application_email"
                placeholder="client@email.com"
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                CP Office Location <span className="text-red-500">*</span>
              </label>
              <select
                name="application_office"
                required
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select CP Office</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="application_dob"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Age</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={age}
                  readOnly
                  placeholder="Auto-computed"
                  className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 text-sm focus:outline-none"
                />
                {isMinor && (
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    Minor
                  </span>
                )}
                {isInfant && (
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    Infant
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Marital Status <span className="text-red-500">*</span>
              </label>
              <select
                name="application_mstatus"
                required
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Single</option>
                <option value="2">Married</option>
                <option value="3">Divorced</option>
                <option value="4">Separated</option>
                <option value="5">Widow / Widower</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="application_employment"
                required
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Not Employed">Not Employed</option>
                <option value="Private">Private</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Government">Government</option>
                <option value="Student">Student</option>
                <option value="Homemaker">Homemaker</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Conditional Engines (Reissue / Employment / Marital) */}
        {(isReissue || isGovtEmployee || employmentType === "Student" || isMarried || requiresNationalityProof) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Intake Scenario Engines
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fresh Nationality Cutoffs */}
              {isFresh && requiresNationalityProof && (
                <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Fresh Application Nationality Rule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nationality Status</label>
                      <input
                        type="text"
                        value={nationalityStatus === 2 ? "Requires both parents' proof" : "Requires any one parent's proof"}
                        readOnly
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none"
                      />
                      <input type="hidden" name="application_nstatus" value={nationalityStatus || ""} />
                    </div>

                    {nationalityStatus === 1 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Parent Proof of Nationality <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="application_nproof"
                          required
                          value={nProof}
                          onChange={(e) => setNProof(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                        >
                          <option value="">Select Proof</option>
                          <option value="Mother Birth Certificate">Mother Birth Certificate</option>
                          <option value="Father Birth Certificate">Father Birth Certificate</option>
                          <option value="Mother Passport">Mother Passport</option>
                          <option value="Father Passport">Father Passport</option>
                          <option value="-1">Other</option>
                        </select>
                        {nProof === "-1" && (
                          <input
                            type="text"
                            name="application_nother"
                            required
                            placeholder="Specify details..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm mt-2"
                          />
                        )}
                      </div>
                    )}

                    {nationalityStatus === 2 && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Mother Proof of Nationality <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="application_mnproof"
                            required
                            value={mnProof}
                            onChange={(e) => setMnProof(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                          >
                            <option value="">Select Proof</option>
                            <option value="Mother Birth Certificate">Mother Birth Certificate</option>
                            <option value="Mother Passport">Mother Passport</option>
                            <option value="-1">Other</option>
                          </select>
                          {mnProof === "-1" && (
                            <input
                              type="text"
                              name="application_mnother"
                              required
                              placeholder="Specify details..."
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm mt-2"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Father Proof of Nationality <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="application_fnproof"
                            required
                            value={fnProof}
                            onChange={(e) => setFnProof(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                          >
                            <option value="">Select Proof</option>
                            <option value="Father Birth Certificate">Father Birth Certificate</option>
                            <option value="Father Passport">Father Passport</option>
                            <option value="-1">Other</option>
                          </select>
                          {fnProof === "-1" && (
                            <input
                              type="text"
                              name="application_fnother"
                              required
                              placeholder="Specify details..."
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm mt-2"
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Reissue Logic */}
              {isReissue && (
                <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Reissue Validation Engine</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Reason for Reissue <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="application_reissue_reason"
                        required
                        value={reissueReason}
                        onChange={(e) => setReissueReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                      >
                        <option value="">Select Reason</option>
                        <option value="Expired">Expired</option>
                        <option value="Lost">Lost</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Change in Address">Change in Address</option>
                        <option value="Change in Name">Change in Name</option>
                        <option value="Addition of Spouse">Addition of Spouse</option>
                        <option value="Deletion of Spouse">Deletion of Spouse</option>
                      </select>
                    </div>

                    {reissueReason === "Lost" && (
                      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-3">
                        <h5 className="text-xs font-semibold text-red-300">Lost Passport Required Actions:</h5>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={firUploaded}
                              onChange={(e) => setFirUploaded(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-red-500"
                            />
                            FIR Copy Uploaded & Verified
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={affidavitConfirm}
                              onChange={(e) => setAffidavitConfirm(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-red-500"
                            />
                            Affidavit Confirmation Complete
                          </label>
                        </div>
                      </div>
                    )}

                    {reissueReason === "Change in Name" && (
                      <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg">
                        <p className="text-xs text-amber-300 font-medium">
                          ⚠️ Change in Name requires checking **Gazette** & **Newspaper Notice** in Additional Documents. 
                          {isMarried && " (Marriage Proof is also required as Marital Status is Married)"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Employment logic */}
              {(isGovtEmployee || employmentType === "Student") && (
                <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Employment Verification Engine</h4>
                  {isGovtEmployee && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={nocConfirm}
                          onChange={(e) => setNocConfirm(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                        />
                        Government NOC Checked & Received
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={icConfirm}
                          onChange={(e) => setIcConfirm(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                        />
                        Identity Certificate Checked & Received
                      </label>
                    </div>
                  )}
                  {employmentType === "Student" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Student ID Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="application_student_id"
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Enter Student ID / Enrollment Number"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Married logic */}
              {isMarried && (
                <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Marriage Proof Option <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="application_mproof_option"
                    required
                    value={mproofOption}
                    onChange={(e) => setMproofOption(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="">Select Proof Option</option>
                    <option value="Marriage Certificate">Marriage Certificate</option>
                    <option value="Annexure J">Annexure J</option>
                    <option value="Previously Mentioned">Previously Mentioned</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Document Checklists */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Documents checklists
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Address Proof */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">
                Proof of Address <span className="text-red-500">*</span>
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {addressDocs.map((doc) => (
                  <label key={doc.document_id} className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer hover:text-slate-100">
                    <input
                      type="checkbox"
                      name="application_aproof[]"
                      value={doc.document_id}
                      checked={aproofSelected.includes(String(doc.document_id))}
                      onChange={() => handleCheckboxChange(String(doc.document_id), aproofSelected, setAproofSelected)}
                      className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    {doc.document_name}
                  </label>
                ))}
              </div>
            </div>

            {/* DOB Proof */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">
                Proof of Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {dobDocs.map((doc) => (
                  <label key={doc.document_id} className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer hover:text-slate-100">
                    <input
                      type="checkbox"
                      name="application_dproof[]"
                      value={doc.document_id}
                      checked={dproofSelected.includes(String(doc.document_id))}
                      onChange={() => handleCheckboxChange(String(doc.document_id), dproofSelected, setDproofSelected)}
                      className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    {doc.document_name}
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Documents */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">
                Additional / Special Documents
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {additionalDocs.map((doc) => (
                  <label key={doc.document_id} className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer hover:text-slate-100">
                    <input
                      type="checkbox"
                      name="application_addocuments[]"
                      value={doc.document_id}
                      checked={addocSelected.includes(String(doc.document_id))}
                      onChange={() => handleCheckboxChange(String(doc.document_id), addocSelected, setAddocSelected)}
                      className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    {doc.document_name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Validation and Same spelling validation checks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" /> Spelling & Consistency Checks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Is name spelling same on all documents? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="application_name_spelling_same"
                      checked={nameSame === true}
                      onChange={() => setNameSame(true)}
                      className="bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="application_name_spelling_same"
                      checked={nameSame === false}
                      onChange={() => setNameSame(false)}
                      className="bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    No
                  </label>
                </div>
              </div>

              {!nameSame && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-300">
                    Remark (Required) & Show Gazette option <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameRemark}
                    onChange={(e) => setNameRemark(e.target.value)}
                    placeholder="Enter spelling discrepancy details..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                  <p className="text-xs text-amber-400">
                    ⚠️ Name discrepancy requires selecting **Gazette** in Additional Documents.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Is address same on all documents? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="application_address_same"
                      checked={addressSame === true}
                      onChange={() => setAddressSame(true)}
                      className="bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="application_address_same"
                      checked={addressSame === false}
                      onChange={() => setAddressSame(false)}
                      className="bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    No
                  </label>
                </div>
              </div>

              {!addressSame && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-300">
                    Remark (Required) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressRemark}
                    onChange={(e) => setAddressRemark(e.target.value)}
                    placeholder="Describe address difference..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                  <p className="text-xs text-red-400 font-semibold">
                    ⚠️ Address mismatch: File will be automatically marked on HOLD / Needs Review.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Verification Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" /> Staff Final Verification Checklist
          </h3>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyName}
                onChange={(e) => setVerifyName(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Applicant's Name spelling verified in database and docs
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyDob}
                onChange={(e) => setVerifyDob(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Date of Birth verified matching certificate
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyAddress}
                onChange={(e) => setVerifyAddress(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Residential Address verified across proofs
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyOriginals}
                onChange={(e) => setVerifyOriginals(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
              All original documents checked physically in office
            </label>

            {requiresNationalityProof && (
              <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer md:col-span-2">
                <input
                  type="checkbox"
                  checked={verifyNationality}
                  onChange={(e) => setVerifyNationality(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                Parent's Nationality proof verified (Required for this DOB range)
              </label>
            )}
          </div>
        </div>

        {/* Section 6: Additional details & Risk declarations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Final Details & Declarations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Preferred Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="application_bdate"
                required
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Any Past Criminal Cases? <span className="text-red-500">*</span>
              </label>
              <select
                value={criminalCase ? "true" : "false"}
                onChange={(e) => setCriminalCase(e.target.value === "true")}
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
              >
                <option value="false">No Past Criminal Record</option>
                <option value="true">Yes, Case Registered / Past Criminal Record</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Remarks / Office Instructions
              </label>
              <textarea
                name="application_notes"
                rows={3}
                placeholder="Enter extra instructions, references or pending documents lists..."
                className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit bar */}
        <div className="flex gap-4 items-center justify-end">
          <Link
            href="/applications"
            className="px-5 py-2.5 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-900 text-sm font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Application...
              </>
            ) : (
              "Save Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
