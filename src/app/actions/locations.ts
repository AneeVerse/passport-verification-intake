"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getLocations() {
  return prisma.location.findMany({
    orderBy: {
      location_id: "desc",
    },
  });
}

export async function addLocation(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const location_name = formData.get("location_name")?.toString().trim();
  if (!location_name) {
    return { error: "Please Enter Location" };
  }

  // Check if location already exists
  const existing = await prisma.location.findFirst({
    where: { location_name },
  });

  if (existing) {
    return { error: "Location Already Added" };
  }

  const userId = parseInt((session.user as any).id || "1");

  await prisma.location.create({
    data: {
      location_name,
      location_added_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      location_added_by: userId,
      location_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      location_updated_by: userId,
      location_status: 1,
    },
  });

  revalidatePath("/locations");
  return { success: "Location Added Successfully" };
}

export async function updateLocation(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const location_name = formData.get("location_name")?.toString().trim();
  if (!location_name) {
    return { error: "Please Enter Location" };
  }

  // Check if location already exists with a different id
  const existing = await prisma.location.findFirst({
    where: {
      location_name,
      NOT: { location_id: id },
    },
  });

  if (existing) {
    return { error: "Location Already Added" };
  }

  const userId = parseInt((session.user as any).id || "1");

  await prisma.location.update({
    where: { location_id: id },
    data: {
      location_name,
      location_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      location_updated_by: userId,
    },
  });

  revalidatePath("/locations");
  return { success: "Location Updated Successfully" };
}

export async function toggleLocationStatus(id: number, currentStatus: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const newStatus = currentStatus === 1 ? 0 : 1;

  await prisma.location.update({
    where: { location_id: id },
    data: {
      location_status: newStatus,
    },
  });

  revalidatePath("/locations");
  return { success: "Status Changed Successfully" };
}
