import { redirect } from "next/navigation";
import { syncUser } from "./sync-user";
import { Role } from "./roles";

type AuthResult = {
  user: NonNullable<Awaited<ReturnType<typeof syncUser>>>;
  role: Role;
};

/**
 * Centralized authentication and authorization proxy.
 * Synces the user with the database and checks for required roles.
 * Redirects to /unauthorized or login if validation fails.
 *
 * @param requiredRoles Array of roles allowed to access the resource. If empty, any authenticated user is allowed.
 * @returns The synced user object and their role.
 */
export async function proxy(requiredRoles: Role[] = []): Promise<AuthResult> {
  const user = await syncUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.role as Role;

  if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    redirect("/dashboard"); // Redirect to safe Dashboard root if role mismatches
  }

  return { user, role };
}
