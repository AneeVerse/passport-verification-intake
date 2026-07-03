import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { application_trash: 1 },
    include: { office: true },
    orderBy: { application_id: "desc" },
  });

  const headers = [
    "SR No",
    "Date",
    "Applicant Name",
    "Surname",
    "Email",
    "Mobile No",
    "Gender",
    "PSK Location",
    "Appointment Date",
    "Age",
    "Marital Status",
    "Notes",
  ];

  const csvRows = [headers.join(",")];

  for (const app of applications) {
    const genderText =
      app.application_gender === 1 ? "Male" : app.application_gender === 2 ? "Female" : "Transgender";
    const maritalText =
      app.application_mstatus === "2"
        ? "Married"
        : app.application_mstatus === "3"
        ? "Divorced"
        : app.application_mstatus === "4"
        ? "Separated"
        : app.application_mstatus === "5"
        ? "Widow / Widower"
        : "Single";

    const row = [
      app.application_srno || "",
      app.application_date.toISOString().substring(0, 10),
      `"${app.application_name.replace(/"/g, '""')}"`,
      `"${app.application_surname.replace(/"/g, '""')}"`,
      app.application_email,
      app.application_mobile,
      genderText,
      `"${(app.office?.location_name || "").replace(/"/g, '""')}"`,
      app.application_bdate.toISOString().substring(0, 10),
      app.application_age,
      maritalText,
      `"${(app.application_notes || "").replace(/\n/g, " ").replace(/"/g, '""')}"`,
    ];

    csvRows.push(row.join(","));
  }

  const csvContent = csvRows.join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=applications_export.csv",
    },
  });
}
