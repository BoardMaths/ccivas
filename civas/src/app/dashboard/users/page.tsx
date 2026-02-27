import { prisma } from "@/lib/prisma";
import { proxy } from "@/lib/auth";
// import { redirect } from "next/navigation"; // Not needed as proxy handles it
import RoleSelector from "@/components/RoleSelector";

export default async function UsersPage() {
  // Security Guard: Allow Admin and SuperAdmin
  const { role } = await proxy(["ADMIN", "SUPERADMIN"]);

  const canManageRoles = role === "SUPERADMIN";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            User Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage platform users and their access levels.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((user: any) => (
                <tr
                  key={user.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <RoleSelector
                      userId={user.id}
                      currentRole={user.role}
                      disabled={!canManageRoles}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
