import { prisma } from "@/lib/prisma";
import DocumentsClientPage from "./DocumentsClientPage";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: {
      document_id: "desc",
    },
  });

  return <DocumentsClientPage initialDocuments={documents} />;
}
