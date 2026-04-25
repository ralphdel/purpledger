"use server";

import { cookies } from "next/headers";

export async function verifyAdminPassword(password: string) {
  const adminPass = process.env.ADMIN_PORTAL_PASS;
  
  if (password === adminPass) {
    // Set a secure http-only cookie valid for 8 hours
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return true;
  }
  
  return false;
}
