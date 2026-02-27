"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSalaryStructureAction, importSalaryGradesAction } from "@/lib/salary-actions";
import { getStateByCode } from "@/lib/actions";
import Link from "next/link";

export default function SalaryImportPage() {
    const params = useParams();
    const router = useRouter();
    const stateCode = params.stateCode as string;

    const [stateId, setStateId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [jsonInput, setJsonInput] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        async function fetchState() {
            const state = await getStateByCode(stateCode);
            if (state) setStateId(state.id);
        }
        fetchState();
    }, [stateCode]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stateId) {
            setMessage({ type: "error", text: "State context not found." });
            return;
        }
        setIsLoading(true);
        setMessage(null);

        try {
            const grades = JSON.parse(jsonInput);
            if (!Array.isArray(grades)) throw new Error("Input must be an array of grades");

            const res = await createSalaryStructureAction({
                name,
                stateId,
                effectiveDate: new Date().toISOString(),
                description,
                isDefault: true
            });

            if (res.success && res.structure) {
                const importRes = await importSalaryGradesAction(res.structure.id, grades);
                if (importRes.success) {
                    setMessage({ type: "success", text: `Imported ${importRes.count} salary grades successfully!` });
                } else {
                    setMessage({ type: "error", text: "Structure created but grades failed to import." });
                }
            } else {
                setMessage({ type: "error", text: res.error || "Failed to create structure." });
            }
        } catch (err: any) {
            setMessage({ type: "error", text: "Invalid JSON format: " + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href={`/dashboard/states/${stateCode}`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-blue-600 transition-colors">
                        ← Back to Workspace
                    </Link>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mt-2">Salary Table Integration</h1>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Configure State-Specific Pay Scales</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl">
                    <form onSubmit={handleImport} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Structure Name</label>
                                <input
                                    required
                                    placeholder="e.g. CONPSS 2024"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</label>
                                <input
                                    placeholder="e.g. Revised Minimum Wage Implementation"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Salary Table Data (JSON)</label>
                                <span className="text-[9px] font-bold text-blue-500 cursor-help underline">View Format Schema</span>
                            </div>
                            <textarea
                                required
                                rows={12}
                                placeholder='[ { "gradeLevel": "08", "step": "01", "basicSalary": 65000, "grossSalary": 92000, "netSalary": 85000 }, ... ]'
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-3xl px-6 py-6 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                            <p className="text-[10px] text-zinc-400 font-medium italic">Paste the salary structure table provided by the state here as a JSON array.</p>
                        </div>

                        {message && (
                            <div className={`p-6 rounded-2xl font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            disabled={isLoading}
                            className="w-full py-6 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black uppercase tracking-[0.3em] text-xs shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? "IMPORTING PAY SCALE..." : "ACTIVATE SALARY STRUCTURE"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
