import { prisma } from "@/lib/prisma";
import AddApplicationClient from "./AddApplicationClient";

export const dynamic = "force-dynamic";

export default async function AddApplicationPage() {
  const [locations, documents] = await Promise.all([
    prisma.location.findMany({
      where: { location_status: 1 },
      orderBy: { location_name: "asc" },
    }),
    prisma.document.findMany({
      where: { document_status: 1 },
      orderBy: { document_name: "asc" },
    }),
  ]);

  const addressDocs = documents.filter((doc) => doc.document_category === 1);
  const dobDocs = documents.filter((doc) => doc.document_category === 2);
  const additionalDocs = documents.filter((doc) => doc.document_category === 3);

  return (
    <AddApplicationClient
      locations={locations as any}
      addressDocs={addressDocs as any}
      dobDocs={dobDocs as any}
      additionalDocs={additionalDocs as any}
    />
  );
}
