"use server";

import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export async function updateUserRole(
  userId: string,
  newRole: "SUPERADMIN" | "ADMIN" | "USER"
) {
  // Security check: Only Super Admins can change roles
  const superAdminStatus = await isSuperAdmin();
  if (!superAdminStatus) {
    return {
      success: false,
      error: "Unauthorized: Only Super Admins can manage roles.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
}
