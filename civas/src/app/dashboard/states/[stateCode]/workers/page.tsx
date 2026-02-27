import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createWorker } from "@/lib/actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import WorkerVerificationToggle from "./WorkerVerificationToggle";
import ExportFlaggedWorkers from "./ExportFlaggedWorkers";

export default async function StateWorkersPage({
    params
}: {
    params: Promise<{ stateCode: string }>
}) {
    const { stateCode } = await params;
    const rawState = await prisma.state.findUnique({
        where: { code: stateCode.toUpperCase() },
        include: {
            workers: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!rawState) notFound();

    // Completely serialize to avoid Prisma/Decimal object issues in RSC -> Client props
    const state = JSON.parse(JSON.stringify(rawState));
    const workers = state.workers;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                        <Link href={`/dashboard/states/${state.code}`} className="hover:underline">{state.name} State</Link>
                        <span>/</span>
                        <span>Personnel Registry</span>
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Personnel Registry</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 italic">Profiled workers for {state.name} State operations.</p>
                </div>

                <div className="flex gap-4">
                    <ExportFlaggedWorkers workers={workers} stateName={state.name} />
                    <Link
                        href={`/dashboard/states/${state.code}/workers/upload`}
                        className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                        Profile New Worker
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        <tr>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">Staff ID</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">Full Name</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">Rank / Grade</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">Issues / Flag</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {workers.map((w: any) => (
                            <tr key={w.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group">
                                <td className="px-8 py-5">
                                    <Link href={`/dashboard/states/${state.code}/workers/${w.id}`} className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md hover:underline">
                                        {w.staffId}
                                    </Link>
                                </td>
                                <td className="px-8 py-5">
                                    <Link href={`/dashboard/states/${state.code}/workers/${w.id}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                        {w.fullName}
                                    </Link>
                                    <div className="flex gap-2 items-center">
                                        <div className="text-[10px] text-zinc-500">{new Date(w.createdAt).toLocaleDateString()}</div>
                                        {w.dob && (
                                            <div className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                                                <span>•</span>
                                                <span>DOB: {new Date(w.dob).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {(w as any).gradeLevel ? `GL ${(w as any).gradeLevel}` : (w as any).rank || "—"}
                                    {(w as any).step ? ` / Step ${(w as any).step}` : ""}
                                </td>
                                <td className="px-8 py-5 text-sm">
                                    {(w as any).isFlagged ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                Flagged
                                            </span>
                                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium max-w-[200px] leading-tight">
                                                {(w as any).flagReason}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-400 text-xs">No issues detected</span>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <WorkerVerificationToggle workerId={w.id} initialIsVerified={w.isVerified} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {workers.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                        </div>
                        <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-xl">No Workers Found</h3>
                        <p className="mt-1 text-zinc-500">Begin by profiling the first worker for {state.name} State.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
