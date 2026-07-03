"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/upload";
import bcrypt from "bcryptjs";

export async function getSettings() {
  return prisma.settings.findFirst({
    where: { settings_status: 1 },
  });
}

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = parseInt((session.user as any).id || "1");

  const settings_title = formData.get("settings_title")?.toString().trim();
  const settings_company = formData.get("settings_company")?.toString().trim();
  const settings_email = formData.get("settings_email")?.toString().trim();
  const settings_phone = formData.get("settings_phone")?.toString().trim();
  const settings_address = formData.get("settings_address")?.toString().trim();

  if (!settings_title || !settings_company || !settings_email || !settings_phone || !settings_address) {
    return { error: "All basic fields are required" };
  }

  const data: any = {
    settings_title,
    settings_company,
    settings_email,
    settings_phone,
    settings_address,
    settings_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
    settings_updated_by: userId,
  };

  const logoFile = formData.get("settings_logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const relativeUrl = await uploadFile(logoFile, "logo");
    data.settings_logo = relativeUrl.split("/").pop() || "";
  }

  const faviconFile = formData.get("settings_favicon") as File | null;
  if (faviconFile && faviconFile.size > 0) {
    const relativeUrl = await uploadFile(faviconFile, "logo");
    data.settings_favicon = relativeUrl.split("/").pop() || "";
  }

  await prisma.settings.updateMany({
    where: { settings_status: 1 },
    data,
  });

  revalidatePath("/settings");
  return { success: "Details Updated Successfully" };
}

export async function updateEmailSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = parseInt((session.user as any).id || "1");

  const settings_mailer = formData.get("settings_mailer")?.toString().trim();
  const settings_host = formData.get("settings_host")?.toString().trim();
  const settings_port = parseInt(formData.get("settings_port")?.toString() || "");
  const settings_uname = formData.get("settings_uname")?.toString().trim();
  const settings_pwd = formData.get("settings_pwd")?.toString().trim();
  const settings_encryption = formData.get("settings_encryption")?.toString().trim();
  const settings_faddress = formData.get("settings_faddress")?.toString().trim();
  const settings_fname = formData.get("settings_fname")?.toString().trim();

  if (
    !settings_mailer ||
    !settings_host ||
    isNaN(settings_port) ||
    !settings_uname ||
    !settings_pwd ||
    !settings_encryption ||
    !settings_faddress ||
    !settings_fname
  ) {
    return { error: "All email setting fields are required" };
  }

  await prisma.settings.updateMany({
    where: { settings_status: 1 },
    data: {
      settings_mailer,
      settings_host,
      settings_port,
      settings_uname,
      settings_pwd,
      settings_encryption,
      settings_faddress,
      settings_fname,
      settings_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      settings_updated_by: userId,
    },
  });

  revalidatePath("/settings");
  return { success: "Details Updated Successfully" };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = parseInt((session.user as any).id || "1");

  const user_name = formData.get("user_name")?.toString().trim();
  const user_email = formData.get("user_email")?.toString().trim();
  const user_phone = formData.get("user_phone")?.toString().trim();

  if (!user_name || !user_email || !user_phone) {
    return { error: "All profile fields are required" };
  }

  // Check unique email
  const existing = await prisma.user.findFirst({
    where: {
      user_email,
      NOT: { user_id: userId },
    },
  });

  if (existing) {
    return { error: "Email Address Already Exists" };
  }

  const data: any = {
    user_name,
    user_email,
    user_phone,
    user_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
    user_updated_by: userId,
  };

  const imageFile = formData.get("user_image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const relativeUrl = await uploadFile(imageFile, "profile");
    data.user_image = relativeUrl.split("/").pop() || "";
  }

  await prisma.user.update({
    where: { user_id: userId },
    data,
  });

  revalidatePath("/settings");
  return { success: "Details Updated Successfully" };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = parseInt((session.user as any).id || "1");

  const current_password = formData.get("current_password")?.toString();
  const new_password = formData.get("new_password")?.toString();
  const confirm_password = formData.get("confirm_password")?.toString();

  if (!current_password || !new_password || !confirm_password) {
    return { error: "All password fields are required" };
  }

  if (new_password !== confirm_password) {
    return { error: "Confirm password does not match new password" };
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    return { error: "User not found" };
  }

  // Compare old password with stored user_vpassword base64
  const expectedBase64 = Buffer.from(current_password).toString("base64");
  if (user.user_vpassword !== expectedBase64) {
    return { error: "Current password check failed" };
  }

  // Save new hashed password and base64 vpassword
  const user_password = bcrypt.hashSync(new_password, 12);
  const user_vpassword = Buffer.from(new_password).toString("base64");

  await prisma.user.update({
    where: { user_id: userId },
    data: {
      user_password,
      user_vpassword,
      user_updated_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      user_updated_by: userId,
    },
  });

  return { success: "Password Updated Successfully" };
}
