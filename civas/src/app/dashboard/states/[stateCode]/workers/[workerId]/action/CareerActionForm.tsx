"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCareerAction } from "@/lib/actions";
import { fetchSalaryAction } from "@/lib/salary-actions";
import { formatNaira } from "@/lib/salary-utils";
import Link from "next/link";

export default function CareerActionForm({ worker, stateCode }: { worker: any; stateCode: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [type, setType] = useState("PROMOTION");
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [toGradeLevel, setToGradeLevel] = useState(worker.gradeLevel || "01");
    const [toStep, setToStep] = useState(worker.step || "01");
    const [toDesignation, setToDesignation] = useState(worker.designation || "");
    const [calculatedSalary, setCalculatedSalary] = useState("0");
    const [authorityReference, setAuthorityReference] = useState("");
    const [gazetteNumber, setGazetteNumber] = useState("");
    const [remarks, setRemarks] = useState("");

    // Auto-calculate salary
    useEffect(() => {
        async function updateSalary() {
            if (toGradeLevel && toStep) {
                const res = await fetchSalaryAction({
                    stateId: worker.stateId,
                    cadreId: worker.cadreId,
                    gradeLevel: toGradeLevel,
                    step: toStep
                });
                if (res.success && res.salary) {
                    setCalculatedSalary(res.salary.basicSalary.toString());
                }
            }
        }
        updateSalary();
    }, [toGradeLevel, toStep, worker.stateId, worker.cadreId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const result = await createCareerAction({
            workerId: worker.id,
            type: type as any,
            effectiveDate,
            toGradeLevel,
            toStep,
            toDesignation,
            toSalary: calculatedSalary,
            authorityReference,
            gazetteNumber,
            remarks
        });

        if (result.success) {
            setMessage({ type: "success", text: `${type.replace(/_/g, ' ')} recorded successfully!` });
            setTimeout(() => router.push(`/dashboard/states/${stateCode}/workers/${worker.id}`), 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to record action" });
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="mb-10">
                <Link href={`/dashboard/states/${stateCode}/workers/${worker.id}`} className="text-sm font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-2 mb-4 uppercase tracking-widest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Profile
                </Link>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Record Career Action</h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Record a promotion, conversion, or other career move for {worker.fullName}.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Action Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            >
                                <option value="PROMOTION">PROMOTION</option>
                                <option value="CONVERSION">CONVERSION</option>
                                <option value="ADVANCEMENT">ADVANCEMENT</option>
                                <option value="CONFIRMATION">CONFIRMATION</option>
                                <option value="TRANSFER">TRANSFER</option>
                                <option value="DEMOTION">DEMOTION</option>
                                <option value="SECONDMENT">SECONDMENT</option>
                                <option value="ACTING_APPOINTMENT">ACTING APPOINTMENT</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Effective Date</label>
                                <input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Target Designation</label>
                                <input
                                    placeholder="New Post Title"
                                    value={toDesignation}
                                    onChange={(e) => setToDesignation(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">New Grade Level</label>
                                <select
                                    value={toGradeLevel}
                                    onChange={(e) => setToGradeLevel(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold"
                                >
                                    {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                                        <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">New Step</label>
                                <select
                                    value={toStep}
                                    onChange={(e) => setToStep(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold"
                                >
                                    {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                                        <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Estimated Basic Salary</p>
                                <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{formatNaira(calculatedSalary)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Update Reason</p>
                                <p className="text-xs font-bold text-blue-600">{type}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>
                        Official Documentation
                    </h3>
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Authority Reference (Required for Audit)</label>
                            <input
                                placeholder="e.g. EB/CSC/PROM/2024/001"
                                value={authorityReference}
                                onChange={(e) => setAuthorityReference(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Gazette Publication Number</label>
                            <input
                                placeholder="e.g. Vol. 12 Page 45"
                                value={gazetteNumber}
                                onChange={(e) => setGazetteNumber(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Internal Remarks / Notes</label>
                            <textarea
                                rows={3}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-5 py-4 text-sm font-medium"
                            />
                        </div>
                    </div>
                </section>

                {message && (
                    <div className={`p-6 rounded-3xl font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {message.type === 'success' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        )}
                        {message.text}
                    </div>
                )}

                <button
                    disabled={isLoading}
                    className="w-full py-5 rounded-3xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    {isLoading ? "Recording..." : "Finalize & Record Action"}
                </button>
            </form>
        </div>
    );
}
