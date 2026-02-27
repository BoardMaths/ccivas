import { auth } from "@/auth";
import { prisma } from "./prisma";

export type Role = "SUPERADMIN" | "ADMIN" | "USER";

export async function getUserRole(): Promise<Role> {
  const session = await auth();
  return (session?.user as any)?.role as Role || "USER";
}

export async function isSuperAdmin() {
  const role = await getUserRole();
  return role === "SUPERADMIN";
}

export async function isAdmin() {
  const role = await getUserRole();
  return role === "SUPERADMIN" || role === "ADMIN";
}
