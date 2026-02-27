import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StateDashboardPage({
  params,
}: {
  params: Promise<{ stateCode: string }>;
}) {
  const { stateCode } = await params;
  const state = await prisma.state.findUnique({
    where: { code: stateCode.toUpperCase() },
    include: {
      _count: {
        select: {
          workers: true,
        },
      },
    },
  });

  if (!state) notFound();

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <span>/</span>
          <span>{state.name} State</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {state.name} Workspace
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/dashboard/states/${state.code}/workers`}
          className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 transition-all hover:border-blue-500 dark:bg-zinc-950 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
            Total Workers
          </h3>
          <p className="text-4xl font-bold mt-2 text-zinc-900 dark:text-zinc-50">
            {state._count.workers}
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Manage staffing for {state.name}
          </p>
        </Link>

        {/* Removed Projects and Documents cards as they are not in schema */}
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/dashboard/states/${state.code}/workers/upload`}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Upload Workers
          </Link>
          <Link
            href={`/dashboard/states/${state.code}/salary`}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-semibold hover:border-blue-500 transition-all dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Salary Table Integration
          </Link>
        </div>
      </div>
    </div>
  );
}
