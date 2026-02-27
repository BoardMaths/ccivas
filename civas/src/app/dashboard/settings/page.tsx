import { proxy } from "@/lib/auth";

export default async function SettingsPage() {
  const { user: syncedUser, role } = await proxy();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="max-w-xl space-y-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={syncedUser?.email || ""}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
            />

          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Role
            </label>
            <div className="flex h-10 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-800">
              <span className="font-mono">{role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
