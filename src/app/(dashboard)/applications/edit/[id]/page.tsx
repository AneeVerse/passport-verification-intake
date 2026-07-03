import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditApplicationClient from "./EditApplicationClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditApplicationPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  const [application, locations, documents] = await Promise.all([
    prisma.application.findUnique({
      where: { application_id: id },
    }),
    prisma.location.findMany({
      where: { location_status: 1 },
      orderBy: { location_name: "asc" },
    }),
    prisma.document.findMany({
      where: { document_status: 1 },
      orderBy: { document_name: "asc" },
    }),
  ]);

  if (!application) {
    notFound();
  }

  const addressDocs = documents.filter((doc) => doc.document_category === 1);
  const dobDocs = documents.filter((doc) => doc.document_category === 2);
  const additionalDocs = documents.filter((doc) => doc.document_category === 3);

  return (
    <EditApplicationClient
      application={application as any}
      locations={locations as any}
      addressDocs={addressDocs as any}
      dobDocs={dobDocs as any}
      additionalDocs={additionalDocs as any}
    />
  );
}
