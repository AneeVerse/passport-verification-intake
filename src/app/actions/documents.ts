"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getDocuments() {
  return prisma.document.findMany({
    orderBy: {
      document_id: "desc",
    },
  });
}

export async function addDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const document_category = parseInt(formData.get("document_category")?.toString() || "");
  const document_name = formData.get("document_name")?.toString().trim();

  if (isNaN(document_category)) {
    return { error: "Please Select Category" };
  }
  if (!document_name) {
    return { error: "Please Enter Document" };
  }

  // Check if document already exists
  const existing = await prisma.document.findFirst({
    where: {
      document_category,
      document_name,
    },
  });

  if (existing) {
    return { error: "Document Already Added" };
  }

  const userId = parseInt((session.user as any).id || "1");

  await prisma.document.create({
    data: {
      document_category,
      document_name,
      document_added_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      document_added_by: userId,
      document_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      document_updated_by: userId,
      document_status: 1,
    },
  });

  revalidatePath("/documents");
  return { success: "Document Added Successfully" };
}

export async function updateDocument(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const document_category = parseInt(formData.get("document_category")?.toString() || "");
  const document_name = formData.get("document_name")?.toString().trim();

  if (isNaN(document_category)) {
    return { error: "Please Select Category" };
  }
  if (!document_name) {
    return { error: "Please Enter Document" };
  }

  // Check if duplicate exists
  const existing = await prisma.document.findFirst({
    where: {
      document_category,
      document_name,
      NOT: { document_id: id },
    },
  });

  if (existing) {
    return { error: "Document Already Added" };
  }

  const userId = parseInt((session.user as any).id || "1");

  await prisma.document.update({
    where: { document_id: id },
    data: {
      document_category,
      document_name,
      document_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      document_updated_by: userId,
    },
  });

  revalidatePath("/documents");
  return { success: "Document Updated Successfully" };
}

export async function toggleDocumentStatus(id: number, currentStatus: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const newStatus = currentStatus === 1 ? 0 : 1;

  await prisma.document.update({
    where: { document_id: id },
    data: {
      document_status: newStatus,
    },
  });

  revalidatePath("/documents");
  return { success: "Status Changed Successfully" };
}
