import { prisma } from "@/lib/prisma";
import { State } from "@prisma/client";
import StatesWorkspace from "@/components/StatesWorkspace";

type StateWithCount = State & {
  _count: {
    workers: number;
  };
};

export default async function DashboardPage() {
  // Fetch all states with counts
  const states: StateWithCount[] = await prisma.state.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          workers: true,
        },
      },
    },
  });

  // Fetch System-wide Audit Stats
  const auditStats = await prisma.worker.groupBy({
    by: ['isFlagged', 'flagSeverity'],
    _count: {
      _all: true
    }
  });

  const totalWorkers = await prisma.worker.count();
  const flaggedCount = await prisma.worker.count({ where: { isFlagged: true } });

  const criticalCount = auditStats.find((s: any) => s.isFlagged && s.flagSeverity === 'CRITICAL')?._count._all || 0;
  const highCount = auditStats.find((s: any) => s.isFlagged && s.flagSeverity === 'HIGH')?._count._all || 0;

  // Serialize to plain object for Client Component prop stability
  const serializedStates = JSON.parse(JSON.stringify(states));
  const serializedStats = {
    total: totalWorkers,
    flagged: flaggedCount,
    critical: criticalCount,
    high: highCount
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 lg:p-16 max-w-7xl mx-auto">
      <div className="mb-20">
        <div className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 uppercase mb-6">
          System Overview
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 lg:text-8xl">
          Central Registry <br />
          <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Workspace
          </span>
        </h1>
        <p className="mt-8 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-medium">
          Securely manage personnel, forensic documents, and project investigations across all supported regional registries.
        </p>
      </div>

      {/* Audit Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Personnel</div>
          <div className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{serializedStats.total}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Flagged Records</div>
          <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{serializedStats.flagged}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Critical Risks</div>
          <div className="text-4xl font-black text-red-600">{serializedStats.critical}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">High Severity</div>
          <div className="text-4xl font-black text-orange-500">{serializedStats.high}</div>
        </div>
      </div>

      <StatesWorkspace initialStates={serializedStates} />
    </div>
  );
}
