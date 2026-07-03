"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Please enter both email and password" };
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    // Next.js redirect mechanism throws a Redirect error under the hood. 
    // We must let it bubble up so Next.js handles the redirect correctly.
    if (
      error instanceof Error &&
      (error.message.includes("NEXT_REDIRECT") || (error as any).digest?.includes("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    return { error: "Invalid credentials." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
