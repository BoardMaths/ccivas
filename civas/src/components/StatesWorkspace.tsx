"use client";

import { useState } from "react";
import Link from "next/link";
import { State } from "@prisma/client";

type StateWithCount = State & {
    _count: {
        workers: number;
    };
};

export default function StatesWorkspace({
    initialStates,
    priorityNames = ["Edo", "Ebonyi", "Imo"]
}: {
    initialStates: StateWithCount[],
    priorityNames?: string[]
}) {
    const [search, setSearch] = useState("");

    const filteredStates = initialStates.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    const featured = filteredStates.filter((s) => priorityNames.includes(s.name));
    const others = filteredStates.filter((s) => !priorityNames.includes(s.name));

    return (
        <div className="space-y-12">
            {/* Search Bar */}
            <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search for a state or code..."
                    className="block w-full pl-12 pr-4 py-4 text-lg bg-white/50 backdrop-blur-xl border border-zinc-200 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 shadow-xl shadow-zinc-200/50 dark:shadow-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {featured.length > 0 && (
                <section>
                    <h2 className="mb-8 flex items-center gap-3 text-2xl font-black text-zinc-900 dark:text-zinc-100 italic uppercase tracking-tighter">
                        <span className="h-2 w-12 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/50" />
                        Priority Workspaces
                    </h2>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {featured.map((state) => (
                            <Link
                                key={state.id}
                                href={`/dashboard/states/${state.code}`}
                                className="group relative overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white p-10 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-blue-500 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/50"
                            >
                                {/* Gradient Blur Background */}
                                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-[80px] group-hover:bg-blue-500/10 transition-colors" />

                                <div className="relative z-10">
                                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-[0.2em] text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 uppercase mb-4">
                                        {state.code} State
                                    </span>
                                    <h3 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight group-hover:bg-linear-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                                        {state.name}
                                    </h3>

                                    <div className="mt-12 flex items-center gap-10">
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                                                {state._count.workers}
                                            </span>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                                                Profiled Workers
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Aesthetic Arrow */}
                                <div className="absolute bottom-10 right-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {others.length > 0 && (
                <section>
                    <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        <span className="h-1.5 w-8 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                        Regional Registries
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {others.map((state) => (
                            <Link
                                key={state.id}
                                href={`/dashboard/states/${state.code}`}
                                className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-b from-white to-zinc-50/50 p-6 shadow-sm transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-950 dark:from-zinc-900/50 dark:to-zinc-950"
                            >
                                <span className="absolute top-0 right-0 w-12 h-12 bg-blue-500/0 rounded-bl-full group-hover:bg-blue-500/5 transition-all" />
                                <span className="block text-sm font-black text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {state.name}
                                </span>
                                <span className="mt-1 block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                    {state.code} Workspace
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {filteredStates.length === 0 && (
                <div className="py-20 text-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="mx-auto w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">No workspaces match your search</h3>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">Try searching for a different state name or code.</p>
                </div>
            )}
        </div>
    );
}
