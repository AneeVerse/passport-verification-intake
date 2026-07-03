"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getApplications(params: {
  page?: number;
  search?: string;
  status?: string;
}) {
  const page = params.page || 1;
  const search = params.search || "";
  const status = params.status ? parseInt(params.status) : undefined;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = {
    application_trash: 1,
  };

  if (status !== undefined && !isNaN(status)) {
    where.application_status = status;
  }

  if (search) {
    where.OR = [
      { application_name: { contains: search, mode: "insensitive" } },
      { application_surname: { contains: search, mode: "insensitive" } },
      { application_email: { contains: search, mode: "insensitive" } },
      { application_mobile: { contains: search } },
      { application_srno: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        office: true,
      },
      orderBy: {
        application_id: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return {
    items,
    total,
    pages: Math.ceil(total / limit),
  };
}

// Helper to compute Status and Risk
function evaluateStatusAndRisk(data: {
  application_type: number;
  application_dob: Date;
  application_age: number;
  application_employment: string;
  application_student_id: string;
  application_mstatus: string;
  aproof: string[];
  dproof: string[];
  addocuments: string[];
  application_reissue_reason: string;
  application_fir_uploaded: boolean;
  application_affidavit_confirm: boolean;
  application_mproof_option: string;
  application_noc_confirm: boolean;
  application_ic_confirm: boolean;
  application_name_spelling_same: boolean;
  application_name_mismatch_remark: string;
  application_address_same: boolean;
  application_address_remark: string;
  application_verify_name: boolean;
  application_verify_dob: boolean;
  application_verify_nationality: boolean;
  application_verify_address: boolean;
  application_verify_originals: boolean;
  application_mode: number;
  application_criminal_case: boolean;
}) {
  let isComplete = true;

  // 1. Core verification checklists
  if (
    !data.application_verify_name ||
    !data.application_verify_dob ||
    !data.application_verify_address ||
    !data.application_verify_originals
  ) {
    isComplete = false;
  }

  // 2. Nationality logic (Fresh applications only)
  const dobTime = data.application_dob.getTime();
  const singleParentCutoff = new Date(1987, 6, 1).getTime();
  const bothParentsCutoff = new Date(2004, 11, 3).getTime();
  const isFresh = data.application_type === 1;
  const requiresNationalityProof = isFresh && dobTime >= singleParentCutoff;

  if (requiresNationalityProof) {
    if (!data.application_verify_nationality) {
      isComplete = false;
    }
  }

  // 3. Name mismatch checks
  if (!data.application_name_spelling_same && !data.application_name_mismatch_remark) {
    isComplete = false;
  }

  // 4. Address mismatch checks
  if (!data.application_address_same && !data.application_address_remark) {
    isComplete = false;
  }

  // 5. Checklist documents presence
  if (data.aproof.length === 0) isComplete = false;
  if (data.dproof.length === 0) isComplete = false;

  // 6. Age engine logics
  if (data.application_age < 4) {
    // 2 Photos required (ID 21)
    if (!data.addocuments.includes("21")) {
      isComplete = false;
    }
  }
  if (data.application_age < 18) {
    // Annexure H required (ID 17)
    if (!data.addocuments.includes("17")) {
      isComplete = false;
    }
  }

  // 7. Employment engine logic
  if (data.application_employment === "Government") {
    // NOC (ID 24) and Identity Certificate (ID 25) required
    if (!data.addocuments.includes("24") || !data.addocuments.includes("25")) {
      isComplete = false;
    }
    if (!data.application_noc_confirm || !data.application_ic_confirm) {
      isComplete = false;
    }
  } else if (data.application_employment === "Student") {
    if (!data.application_student_id) {
      isComplete = false;
    }
  }

  // 8. Reissue engine logic
  if (data.application_type === 2) {
    if (!data.application_reissue_reason) {
      isComplete = false;
    }
    if (data.application_reissue_reason === "Lost") {
      if (!data.application_fir_uploaded || !data.application_affidavit_confirm) {
        isComplete = false;
      }
      // FIR Copy (ID 26) required
      if (!data.addocuments.includes("26")) {
        isComplete = false;
      }
    } else if (data.application_reissue_reason === "Change in Name") {
      // Gazette (ID 22) and Newspaper (ID 23) required
      if (!data.addocuments.includes("22") || !data.addocuments.includes("23")) {
        isComplete = false;
      }
      if (data.application_mstatus === "2" && !data.addocuments.includes("27") && !data.addocuments.includes("18")) {
        // Marriage Certificate (ID 27) or Annexure J (ID 18) required if married
        isComplete = false;
      }
    }
  }

  // 9. Marital Status engine logic
  if (data.application_mstatus === "2") {
    if (!data.application_mproof_option) {
      isComplete = false;
    }
    if (data.application_mproof_option === "Marriage Certificate") {
      if (!data.addocuments.includes("27")) isComplete = false;
    } else if (data.application_mproof_option === "Annexure J") {
      if (!data.addocuments.includes("18")) isComplete = false;
    }
  }

  // Calculate status: 1 = HOLD, 2 = READY
  const status = isComplete ? 2 : 1;

  // Calculate risk level: Low, Medium, High
  let risk = "Low";
  const isHighRisk =
    data.application_criminal_case ||
    !data.application_name_spelling_same ||
    !data.application_address_same ||
    (data.application_type === 2 && data.application_reissue_reason === "Lost");

  const isMediumRisk =
    data.application_age < 18 ||
    data.application_mode === 2 || // Tatkaal
    (data.application_type === 2 &&
      ["Change in Name", "Change in Address", "Damaged"].includes(data.application_reissue_reason));

  if (isHighRisk) {
    risk = "High";
  } else if (isMediumRisk) {
    risk = "Medium";
  }

  return { status, risk };
}

export async function addApplication(formData: FormData): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = parseInt((session.user as any).id || "1");

  // Generate SR number
  const count = await prisma.application.count();
  const srno = String(count + 1).padStart(3, "0");

  const application_date = new Date(formData.get("application_date")?.toString() || "");
  const application_type = parseInt(formData.get("application_type")?.toString() || "1");
  const application_mode = parseInt(formData.get("application_mode")?.toString() || "1");
  const application_name = formData.get("application_name")?.toString().trim() || "";
  const application_surname = formData.get("application_surname")?.toString().trim() || "";
  const application_email = formData.get("application_email")?.toString().trim() || "";
  const application_gender = parseInt(formData.get("application_gender")?.toString() || "1");
  const application_mobile = formData.get("application_mobile")?.toString().trim() || "";
  const application_office = parseInt(formData.get("application_office")?.toString() || "0");
  const application_dob = new Date(formData.get("application_dob")?.toString() || "");

  // Checklist Arrays
  const aproof = formData.getAll("application_aproof[]").map(String);
  const dproof = formData.getAll("application_dproof[]").map(String);
  const addocuments = formData.getAll("application_addocuments[]").map(String);

  const application_mstatus = formData.get("application_mstatus")?.toString() || "1";
  const application_mproof = formData.get("application_mproof")?.toString() || "0";

  const application_nmismatch = parseInt(formData.get("application_nmismatch")?.toString() || "2");
  const application_nfound = formData.get("application_nfound")?.toString() || "0";
  const application_nfother = formData.get("application_nfother")?.toString() || "";
  const application_nnotes = formData.get("application_nnotes")?.toString() || "";
  const application_ncorrect = parseInt(formData.get("application_ncorrect")?.toString() || "0");

  const application_ecnr = parseInt(formData.get("application_ecnr")?.toString() || "0");
  const application_ecother = formData.get("application_ecother")?.toString() || "";

  const application_bdate = new Date(formData.get("application_bdate")?.toString() || "");
  const application_notes = formData.get("application_notes")?.toString() || "";

  // New spec fields
  const application_employment = formData.get("application_employment")?.toString() || "Not Employed";
  const application_student_id = formData.get("application_student_id")?.toString() || "";
  const application_reissue_reason = formData.get("application_reissue_reason")?.toString() || "";
  const application_fir_uploaded = formData.get("application_fir_uploaded") === "true";
  const application_affidavit_confirm = formData.get("application_affidavit_confirm") === "true";
  const application_mproof_option = formData.get("application_mproof_option")?.toString() || "";
  const application_noc_confirm = formData.get("application_noc_confirm") === "true";
  const application_ic_confirm = formData.get("application_ic_confirm") === "true";

  const application_name_spelling_same = formData.get("application_name_spelling_same") !== "false";
  const application_name_mismatch_remark = formData.get("application_name_mismatch_remark")?.toString() || "";
  const application_address_same = formData.get("application_address_same") !== "false";
  const application_address_remark = formData.get("application_address_remark")?.toString() || "";

  const application_verify_name = formData.get("application_verify_name") === "true";
  const application_verify_dob = formData.get("application_verify_dob") === "true";
  const application_verify_nationality = formData.get("application_verify_nationality") === "true";
  const application_verify_address = formData.get("application_verify_address") === "true";
  const application_verify_originals = formData.get("application_verify_originals") === "true";

  const application_criminal_case = formData.get("application_criminal_case") === "true";

  // Age calculation
  const today = new Date();
  let application_age = today.getFullYear() - application_dob.getFullYear();
  const m = today.getMonth() - application_dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < application_dob.getDate())) {
    application_age--;
  }

  // Nationality Cutoff Configs
  const dobTime = application_dob.getTime();
  const singleParentCutoff = new Date(1987, 6, 1).getTime();
  const bothParentsCutoff = new Date(2004, 11, 3).getTime();

  let application_nstatus: number | null = null;
  let showNationality = application_type === 1;

  if (showNationality) {
    if (dobTime < singleParentCutoff) {
      application_nstatus = 0;
    } else {
      application_nstatus = dobTime >= bothParentsCutoff ? 2 : 1;
    }
  }

  const requiresProof = showNationality && application_nstatus !== 0;

  // Run status and risk engine calculations
  const { status, risk } = evaluateStatusAndRisk({
    application_type,
    application_dob,
    application_age,
    application_employment,
    application_student_id,
    application_mstatus,
    aproof,
    dproof,
    addocuments,
    application_reissue_reason,
    application_fir_uploaded,
    application_affidavit_confirm,
    application_mproof_option,
    application_noc_confirm,
    application_ic_confirm,
    application_name_spelling_same,
    application_name_mismatch_remark,
    application_address_same,
    application_address_remark,
    application_verify_name,
    application_verify_dob,
    application_verify_nationality,
    application_verify_address,
    application_verify_originals,
    application_mode,
    application_criminal_case,
  });

  const data: any = {
    application_date,
    application_type,
    application_mode,
    application_srno: srno,
    application_name,
    application_surname,
    application_email: application_email || null,
    application_gender,
    application_mobile,
    application_office,
    application_dob,
    application_age,
    application_nstatus,
    application_nproof:
      requiresProof && application_nstatus === 1
        ? formData.get("application_nproof")?.toString() || "0"
        : "0",
    application_nother:
      requiresProof &&
      application_nstatus === 1 &&
      formData.get("application_nproof")?.toString() === "-1"
        ? formData.get("application_nother")?.toString() || ""
        : "",
    application_mnproof:
      requiresProof && application_nstatus === 2
        ? formData.get("application_mnproof")?.toString() || "0"
        : "0",
    application_mnother:
      requiresProof &&
      application_nstatus === 2 &&
      formData.get("application_mnproof")?.toString() === "-1"
        ? formData.get("application_mnother")?.toString() || ""
        : "",
    application_fnproof:
      requiresProof && application_nstatus === 2
        ? formData.get("application_fnproof")?.toString() || "0"
        : "0",
    application_fnother:
      requiresProof &&
      application_nstatus === 2 &&
      formData.get("application_fnproof")?.toString() === "-1"
        ? formData.get("application_fnother")?.toString() || ""
        : "",
    application_aproof: aproof.join(","),
    application_aother: aproof.includes("-1")
      ? formData.get("application_aother")?.toString() || ""
      : "",
    application_dproof: dproof.join(","),
    application_dother: dproof.includes("-1")
      ? formData.get("application_dother")?.toString() || ""
      : "",
    application_mstatus,
    application_mproof: application_mstatus === "2" ? application_mproof : "0",
    application_nmismatch,
    application_nfound: application_nmismatch === 1 ? application_nfound : "0",
    application_nfother:
      application_nmismatch === 1 && application_nfound === "-1" ? application_nfother : "",
    application_nnotes: application_nmismatch === 1 ? application_nnotes : "",
    application_ncorrect: application_nmismatch === 1 ? application_ncorrect : 0,
    application_addocuments: addocuments.join(","),
    application_adother: addocuments.includes("-1")
      ? formData.get("application_adother")?.toString() || ""
      : "",
    application_ecnr,
    application_ecother: application_ecnr === -1 ? application_ecother : "",
    application_bdate,
    application_notes,
    application_added_on: new Date().toISOString().replace("T", " ").substring(0, 19),
    application_added_by: userId,
    application_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
    application_updated_by: userId,
    application_status: status, // HOLD or READY
    application_trash: 1,

    // new fields
    application_employment,
    application_student_id,
    application_reissue_reason,
    application_fir_uploaded,
    application_affidavit_confirm,
    application_mproof_option,
    application_noc_confirm,
    application_ic_confirm,
    application_name_spelling_same,
    application_name_mismatch_remark,
    application_address_same,
    application_address_remark,
    application_verify_name,
    application_verify_dob,
    application_verify_nationality,
    application_verify_address,
    application_verify_originals,
    application_risk: risk,
    application_criminal_case,
  };

  await prisma.application.create({ data });

  revalidatePath("/applications");
  return { success: "Application Added Successfully" };
}

export async function deleteApplication(id: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.application.delete({
    where: { application_id: id },
  });

  revalidatePath("/applications");
  return { success: "Application Deleted Successfully" };
}

export async function updateApplicationStatus(id: number, newStatus: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role || "";
  
  // Supervisor only check for APPROVED status (status value 3)
  if (newStatus === 3 && userRole !== "Super Admin") {
    return { error: "Only Supervisors (Super Admin) can approve applications." };
  }

  const userId = parseInt((session.user as any).id || "1");

  await prisma.application.update({
    where: { application_id: id },
    data: {
      application_status: newStatus,
      application_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      application_updated_by: userId,
    },
  });

  revalidatePath("/applications");
  return { success: "Status Changed Successfully" };
}

export async function updateApplication(id: number, formData: FormData): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = parseInt((session.user as any).id || "1");

  const application_date = new Date(formData.get("application_date")?.toString() || "");
  const application_type = parseInt(formData.get("application_type")?.toString() || "1");
  const application_mode = parseInt(formData.get("application_mode")?.toString() || "1");
  const application_name = formData.get("application_name")?.toString().trim() || "";
  const application_surname = formData.get("application_surname")?.toString().trim() || "";
  const application_email = formData.get("application_email")?.toString().trim() || "";
  const application_gender = parseInt(formData.get("application_gender")?.toString() || "1");
  const application_mobile = formData.get("application_mobile")?.toString().trim() || "";
  const application_office = parseInt(formData.get("application_office")?.toString() || "0");
  const application_dob = new Date(formData.get("application_dob")?.toString() || "");

  // Checklist Arrays
  const aproof = formData.getAll("application_aproof[]").map(String);
  const dproof = formData.getAll("application_dproof[]").map(String);
  const addocuments = formData.getAll("application_addocuments[]").map(String);

  const application_mstatus = formData.get("application_mstatus")?.toString() || "1";
  const application_mproof = formData.get("application_mproof")?.toString() || "0";

  const application_nmismatch = parseInt(formData.get("application_nmismatch")?.toString() || "2");
  const application_nfound = formData.get("application_nfound")?.toString() || "0";
  const application_nfother = formData.get("application_nfother")?.toString() || "";
  const application_nnotes = formData.get("application_nnotes")?.toString() || "";
  const application_ncorrect = parseInt(formData.get("application_ncorrect")?.toString() || "0");

  const application_ecnr = parseInt(formData.get("application_ecnr")?.toString() || "0");
  const application_ecother = formData.get("application_ecother")?.toString() || "";

  const application_bdate = new Date(formData.get("application_bdate")?.toString() || "");
  const application_notes = formData.get("application_notes")?.toString() || "";

  // New spec fields
  const application_employment = formData.get("application_employment")?.toString() || "Not Employed";
  const application_student_id = formData.get("application_student_id")?.toString() || "";
  const application_reissue_reason = formData.get("application_reissue_reason")?.toString() || "";
  const application_fir_uploaded = formData.get("application_fir_uploaded") === "true";
  const application_affidavit_confirm = formData.get("application_affidavit_confirm") === "true";
  const application_mproof_option = formData.get("application_mproof_option")?.toString() || "";
  const application_noc_confirm = formData.get("application_noc_confirm") === "true";
  const application_ic_confirm = formData.get("application_ic_confirm") === "true";

  const application_name_spelling_same = formData.get("application_name_spelling_same") !== "false";
  const application_name_mismatch_remark = formData.get("application_name_mismatch_remark")?.toString() || "";
  const application_address_same = formData.get("application_address_same") !== "false";
  const application_address_remark = formData.get("application_address_remark")?.toString() || "";

  const application_verify_name = formData.get("application_verify_name") === "true";
  const application_verify_dob = formData.get("application_verify_dob") === "true";
  const application_verify_nationality = formData.get("application_verify_nationality") === "true";
  const application_verify_address = formData.get("application_verify_address") === "true";
  const application_verify_originals = formData.get("application_verify_originals") === "true";

  const application_criminal_case = formData.get("application_criminal_case") === "true";

  // Age calculation
  const today = new Date();
  let application_age = today.getFullYear() - application_dob.getFullYear();
  const m = today.getMonth() - application_dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < application_dob.getDate())) {
    application_age--;
  }

  // Nationality Cutoff Configs
  const dobTime = application_dob.getTime();
  const singleParentCutoff = new Date(1987, 6, 1).getTime();
  const bothParentsCutoff = new Date(2004, 11, 3).getTime();

  let application_nstatus: number | null = null;
  let showNationality = application_type === 1;

  if (showNationality) {
    if (dobTime < singleParentCutoff) {
      application_nstatus = 0;
    } else {
      application_nstatus = dobTime >= bothParentsCutoff ? 2 : 1;
    }
  }

  const requiresProof = showNationality && application_nstatus !== 0;

  // Run status and risk engine calculations
  const { status, risk } = evaluateStatusAndRisk({
    application_type,
    application_dob,
    application_age,
    application_employment,
    application_student_id,
    application_mstatus,
    aproof,
    dproof,
    addocuments,
    application_reissue_reason,
    application_fir_uploaded,
    application_affidavit_confirm,
    application_mproof_option,
    application_noc_confirm,
    application_ic_confirm,
    application_name_spelling_same,
    application_name_mismatch_remark,
    application_address_same,
    application_address_remark,
    application_verify_name,
    application_verify_dob,
    application_verify_nationality,
    application_verify_address,
    application_verify_originals,
    application_mode,
    application_criminal_case,
  });

  const data: any = {
    application_date,
    application_type,
    application_mode,
    application_name,
    application_surname,
    application_email: application_email || null,
    application_gender,
    application_mobile,
    application_office,
    application_dob,
    application_age,
    application_nstatus,
    application_nproof:
      requiresProof && application_nstatus === 1
        ? formData.get("application_nproof")?.toString() || "0"
        : "0",
    application_nother:
      requiresProof &&
      application_nstatus === 1 &&
      formData.get("application_nproof")?.toString() === "-1"
        ? formData.get("application_nother")?.toString() || ""
        : "",
    application_mnproof:
      requiresProof && application_nstatus === 2
        ? formData.get("application_mnproof")?.toString() || "0"
        : "0",
    application_mnother:
      requiresProof &&
      application_nstatus === 2 &&
      formData.get("application_mnproof")?.toString() === "-1"
        ? formData.get("application_mnother")?.toString() || ""
        : "",
    application_fnproof:
      requiresProof && application_nstatus === 2
        ? formData.get("application_fnproof")?.toString() || "0"
        : "0",
    application_fnother:
      requiresProof &&
      application_nstatus === 2 &&
      formData.get("application_fnproof")?.toString() === "-1"
        ? formData.get("application_fnother")?.toString() || ""
        : "",
    application_aproof: aproof.join(","),
    application_aother: aproof.includes("-1")
      ? formData.get("application_aother")?.toString() || ""
      : "",
    application_dproof: dproof.join(","),
    application_dother: dproof.includes("-1")
      ? formData.get("application_dother")?.toString() || ""
      : "",
    application_mstatus,
    application_mproof: application_mstatus === "2" ? application_mproof : "0",
    application_nmismatch,
    application_nfound: application_nmismatch === 1 ? application_nfound : "0",
    application_nfother:
      application_nmismatch === 1 && application_nfound === "-1" ? application_nfother : "",
    application_nnotes: application_nmismatch === 1 ? application_nnotes : "",
    application_ncorrect: application_nmismatch === 1 ? application_ncorrect : 0,
    application_addocuments: addocuments.join(","),
    application_adother: addocuments.includes("-1")
      ? formData.get("application_adother")?.toString() || ""
      : "",
    application_ecnr,
    application_ecother: application_ecnr === -1 ? application_ecother : "",
    application_bdate,
    application_notes,
    application_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
    application_updated_by: userId,
    application_status: status, // HOLD or READY

    // new fields
    application_employment,
    application_student_id,
    application_reissue_reason,
    application_fir_uploaded,
    application_affidavit_confirm,
    application_mproof_option,
    application_noc_confirm,
    application_ic_confirm,
    application_name_spelling_same,
    application_name_mismatch_remark,
    application_address_same,
    application_address_remark,
    application_verify_name,
    application_verify_dob,
    application_verify_nationality,
    application_verify_address,
    application_verify_originals,
    application_risk: risk,
    application_criminal_case,
  };

  await prisma.application.update({
    where: { application_id: id },
    data,
  });

  revalidatePath("/applications");
  return { success: "Application Updated Successfully" };
}
