"use client";

import { updateUserRole } from "@/app/actions/user-actions";

export default function RoleSelector({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: string;
  disabled?: boolean;
}) {
  return (
    <select
      defaultValue={currentRole}
      disabled={disabled}
      onChange={async (e) => {
        const newRole = e.target.value as "SUPERADMIN" | "ADMIN" | "USER";
        const confirmChange = confirm(
          `Are you sure you want to change this user's role to ${newRole}?`
        );
        if (confirmChange) {
          const result = await updateUserRole(userId, newRole);
          if (!result.success) {
            alert(result.error);
            e.target.value = currentRole; // Revert on failure
          }
        } else {
          e.target.value = currentRole; // Revert on cancel
        }
      }}
      className={`bg-transparent text-sm font-medium focus:outline-none rounded px-2 py-1 border border-zinc-200 dark:border-zinc-800 ${
        disabled
          ? "opacity-50 cursor-not-allowed text-zinc-400"
          : "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
      }`}
    >
      <option value="USER">User</option>
      <option value="ADMIN">Admin</option>
      <option value="SUPERADMIN">Super Admin</option>
    </select>
  );
}
