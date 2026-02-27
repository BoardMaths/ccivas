import { prisma } from "@/lib/prisma";
import { proxy } from "@/lib/auth";

export default async function ActivityLogsPage() {
  await proxy(["SUPERADMIN"]);

  // Fetch real activity data
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      state: {
        select: {
          name: true,
        },
      },
    },
    take: 50, // Limit to recent 50
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Activity Logs
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            View system-wide activities and audit trails.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  State
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  Title
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                      {activity.state.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {activity.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(activity.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    No recent activities found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
