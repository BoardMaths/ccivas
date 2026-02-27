import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatNaira, calculateDetailedSalary } from "@/lib/salary-utils";
import Link from "next/link";

export default async function WorkerProfilePage({
    params
}: {
    params: Promise<{ stateCode: string; workerId: string }>
}) {
    const { stateCode, workerId } = await params;

    const worker = (await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            state: true,
            cadre: true,
            promotions: { orderBy: { date: "desc" } },
            careerActions: { orderBy: { effectiveDate: "desc" } },
            certificates: true,
            leaveRecords: { where: { status: "APPROVED" }, orderBy: { startDate: "desc" } }
        }
    })) as any;

    if (!worker) notFound();

    const activeLeave = worker.leaveRecords?.find((l: any) => {
        const now = new Date();
        return now >= new Date(l.startDate) && now <= new Date(l.endDate);
    });

    const salaryDetails = calculateDetailedSalary(
        worker.gradeLevel,
        worker.step,
        worker.salaryScale,
        worker.isSuspended,
        activeLeave?.type
    );

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans bg-zinc-50/30 dark:bg-zinc-950/30 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-tight">
                        <Link href={`/dashboard/states/${stateCode}`} className="hover:underline">{worker.state.name} State</Link>
                        <span className="text-zinc-300">/</span>
                        <Link href={`/dashboard/states/${stateCode}/workers`} className="hover:underline">Workers</Link>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-500 font-bold">{worker.fullName}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Personnel Profile</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">System Identity: {worker.staffId}</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/dashboard/states/${stateCode}/workers/${workerId}/action`}
                        className="px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-sm transition-all hover:shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                        Record Action
                    </Link>
                    <Link
                        href={`/dashboard/states/${stateCode}/workers/${workerId}/documents`}
                        className="px-6 py-3 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 shadow-sm transition-all hover:shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>
                        Archive
                    </Link>
                    <Link
                        href={`/dashboard/states/${stateCode}/workers/${workerId}/edit`}
                        className="px-6 py-3 text-sm font-bold text-white bg-zinc-900 rounded-2xl hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all hover:shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Edit Profile
                    </Link>
                    <Link
                        href={`/dashboard/states/${stateCode}/workers`}
                        className="px-6 py-3 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                        Registry
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Core Identity */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <div className="h-44 w-44 rounded-3xl bg-zinc-100 dark:bg-zinc-900 mb-8 overflow-hidden border-8 border-zinc-50 dark:border-zinc-900 shadow-inner group-hover:scale-105 transition-transform duration-500">
                            {worker.imageUrl ? (
                                <img src={worker.imageUrl} alt={worker.fullName || ""} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-300 uppercase text-5xl font-bold bg-zinc-100 dark:bg-zinc-900 tracking-tight">
                                    {worker.firstName[0]}{worker.lastName[0]}
                                </div>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-none tracking-tight mb-2">{worker.fullName}</h2>
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 mb-6">{worker.designation || "Unspecified Role"}</span>

                        <div className="inline-flex items-center gap-2 text-sm font-mono text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-900/20 px-6 py-2.5 rounded-2xl tracking-tighter border border-blue-100 dark:border-blue-800/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                            {worker.staffId}
                        </div>

                        {worker.isSuspended && (
                            <div className="mt-6 w-full px-6 py-3 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 animate-pulse">
                                Under Suspension
                            </div>
                        )}
                    </div>

                    {worker.isFlagged ? (
                        <div className="rounded-3xl border-2 border-red-500 bg-red-50 p-8 shadow-2xl dark:border-red-900/50 dark:bg-red-950/30 animate-pulse-subtle">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Registry Alert Flag</h3>
                            </div>
                            <div className="bg-white dark:bg-red-900/40 rounded-2xl p-5 border border-red-200 dark:border-red-900/50 shadow-inner">
                                <ul className="space-y-3">
                                    {worker.flagReason?.split(' | ').map((flag, idx) => (
                                        <li key={idx} className="text-sm font-bold text-red-600 dark:text-red-300 leading-relaxed list-disc ml-4">
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 dark:border-emerald-900/30 dark:bg-emerald-900/10 flex items-center justify-center">
                            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                </div>
                                <h3 className="font-bold text-xs uppercase tracking-widest">Audit Status: Verified</h3>
                            </div>
                        </div>
                    )}

                    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">Personal Vault</h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">Date of Birth</span>
                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{worker.dob ? new Date(worker.dob).toLocaleDateString() : "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">Gender</span>
                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{worker.gender || "—"}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">State of Origin / LGA</span>
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono tracking-tight">{worker.stateOfOrigin} {worker.lgaOfOrigin ? `(${worker.lgaOfOrigin})` : ""}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">NIN</span>
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono tracking-widest">{worker.nin || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Deep Profile */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Employment Architecture */}
                    <div className="rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                        <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Employment Architecture</h3>
                            <div className="px-5 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest">Active Status</div>
                        </div>
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Position Framework</span>
                                </div>
                                <div className="pl-5 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-sm text-zinc-400 uppercase font-bold tracking-tight">Current Designation</p>
                                        <p className="text-xl text-zinc-900 dark:text-zinc-100 font-bold tracking-tight">{worker.designation || "Administrative Officer"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">Grade Level</p>
                                            <p className="text-xl text-blue-600 dark:text-blue-400 font-bold tracking-tight">{worker.gradeLevel ? `GL ${worker.gradeLevel}` : "—"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">Step</p>
                                            <p className="text-xl text-blue-600 dark:text-blue-400 font-bold tracking-tight">{worker.step || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">Salary Scale</p>
                                        <p className="text-sm text-zinc-900 dark:text-zinc-100 font-bold tracking-tight">{worker.salaryScale || "CONPSS (CORE)"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Institutional Context</span>
                                </div>
                                <div className="pl-5 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-sm text-zinc-400 uppercase font-bold tracking-tight">Ministry / MDA / Dept</p>
                                        <p className="text-lg text-zinc-900 dark:text-zinc-100 font-bold tracking-tight">{worker.ministry || "General Registry"}</p>
                                        {worker.department && <p className="text-sm text-zinc-500 font-medium">{worker.department}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">Monthly Net Pay</p>
                                        <p className={`text-2xl font-black tracking-tight ${salaryDetails.isStoppage ? 'text-red-500 line-through' : 'text-zinc-900 dark:text-zinc-50'}`}>
                                            {formatNaira(salaryDetails.netSalary)}
                                        </p>
                                        {salaryDetails.isStoppage && (
                                            <p className="text-[10px] font-bold text-red-500 uppercase">Salary Stopped: {salaryDetails.stoppageReason}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">Cadre</p>
                                            <p className="text-sm text-zinc-900 dark:text-zinc-100 font-bold">{(worker as any).cadre?.name || "Unassigned"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">Appt Type</p>
                                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{(worker as any).appointmentType?.replace(/_/g, ' ') || "TEMPORARY"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Dashboard */}
                        {!salaryDetails.isStoppage && (
                            <div className="p-10 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-6 bg-zinc-50/30 dark:bg-zinc-900/20 text-center">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Gross Pay</p>
                                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{formatNaira(salaryDetails.grossSalary)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Allowances</p>
                                    <p className="text-sm font-black text-emerald-600">{formatNaira(salaryDetails.allowances)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Deductions</p>
                                    <p className="text-sm font-black text-red-500">{formatNaira(salaryDetails.deductions.total)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Net Payable</p>
                                    <p className="text-sm font-black text-blue-600">{formatNaira(salaryDetails.netSalary)}</p>
                                </div>
                            </div>
                        )}

                        <div className="p-10 bg-zinc-50 dark:bg-emerald-900/5 grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Confirmation Status</span>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${(worker as any).isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                    <p className="text-zinc-700 dark:text-zinc-300 font-bold uppercase text-xs">
                                        {(worker as any).isConfirmed ? "Confirmed" : "Not Confirmed"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">1st Appointment</span>
                                <p className="text-zinc-700 dark:text-zinc-300 font-bold">
                                    {worker.dateOfFirstAppointment ? new Date(worker.dateOfFirstAppointment).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Present Step Date</span>
                                <p className="text-zinc-700 dark:text-zinc-300 font-bold">
                                    {worker.dateOfPresentAppointment ? new Date(worker.dateOfPresentAppointment).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Confirmation Details Card */}
                        {worker.dateOfConfirmation && (
                            <div className="p-10 border-t border-zinc-100 dark:border-zinc-800 bg-blue-50/20 dark:bg-blue-900/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Confirmation Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Confirmation Date</span>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{new Date(worker.dateOfConfirmation).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Confirmation Grade/Step</span>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {worker.confirmationGradeLevel ? `GL ${worker.confirmationGradeLevel}` : "—"}
                                            {worker.confirmationStep ? ` / Step ${worker.confirmationStep}` : ""}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Letter Reference</span>
                                        <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{worker.confirmationLetterRef || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Education & NYSC */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">Academic Pillar</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Highest Qualification</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{worker.highestQualification || "Not Listed"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Certificates */}
                        {worker.certificates.length > 0 && (
                            <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">Professional Certificates</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {worker.certificates?.map((cert: any) => (
                                        <div key={cert.id} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800">
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 13 2 2 4-4" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{cert.type}</p>
                                                <p className="text-xs text-zinc-500 font-medium">{cert.institution}, {cert.year}</p>
                                                {cert.certificateNumber && <p className="text-[10px] text-zinc-400 font-mono mt-1">Ref: {cert.certificateNumber}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">National Service</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${worker.nyscStatus === 'DISCHARGED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {worker.nyscStatus || "NONE"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Service Year</p>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{worker.nyscYear || "—"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Region</p>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{worker.nyscState || "—"}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Cert Serial</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">{worker.nyscNumber || "—"}</p>
                                </div>
                            </div>
                        </div>

                        {activeLeave && (
                            <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-10 shadow-xl dark:border-amber-900/30 dark:bg-amber-950/20 col-span-full">
                                <div className="flex items-center gap-3 mb-4 text-amber-700 dark:text-amber-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Active Absence (Leave)</h3>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{activeLeave.type.replace(/_/g, ' ')}</p>
                                        <p className="text-sm font-bold text-amber-600">Until {new Date(activeLeave.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Status</p>
                                        <span className="px-4 py-1.5 rounded-xl bg-amber-200 text-amber-900 font-black text-xs uppercase">Authorized</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Promotion History Timeline */}
                    <div className="rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                        <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
                                Vertical Trajectory (Promotions)
                            </h3>
                        </div>
                        <div className="p-10">
                            {worker.promotions.length === 0 && (worker as any).careerActions?.length === 0 ? (
                                <div className="text-center py-20 text-zinc-400 italic">
                                    No promotional records found in history.
                                </div>
                            ) : (
                                <div className="space-y-12 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
                                    {/* Merge and sort all history items by date descending */}
                                    {[
                                        ...((worker as any).careerActions || []).map((p: any) => ({ ...p, isModern: true, sortDate: new Date(p.effectiveDate) })),
                                        ...(worker.promotions || []).map((p: any) => ({ ...p, isModern: false, sortDate: new Date(p.date) }))
                                    ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()).map((p: any, i: number) => (
                                        <div key={p.id} className={`relative pl-12 ${!p.isModern ? 'opacity-80' : ''}`}>
                                            <div className={`absolute left-3 top-2 h-2.5 w-2.5 rounded-full ${p.isModern ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'bg-zinc-300'} ring-2 ring-white dark:ring-zinc-950`}></div>
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-black uppercase ${p.isModern ? 'text-blue-500' : 'text-zinc-400'}`}>
                                                            {p.sortDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                            {!p.isModern && " (Legacy)"}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                                            {p.isModern ? p.type : "PROMOTION"}
                                                        </span>
                                                    </div>
                                                    <h4 className={`text-lg font-black leading-tight ${p.isModern ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 italic'}`}>
                                                        GL {p.isModern ? p.toGradeLevel : p.gradeLevel} {(p.isModern ? p.toStep : p.step) ? `/ Step ${p.isModern ? p.toStep : p.step}` : ""}
                                                    </h4>
                                                    <p className="text-sm text-zinc-500 font-medium">{(p.isModern ? p.toDesignation : p.designation) || "Updated Designation"}</p>

                                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                                        {(p.authorityReference || p.isModern) && (
                                                            <div>
                                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Authority Ref</p>
                                                                <p className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">{p.authorityReference || "—"}</p>
                                                            </div>
                                                        )}
                                                        {(p.gazetteNumber || p.isModern) && (
                                                            <div>
                                                                <p className="text-[9px] font-bold text-zinc-400 uppercase">Gazette No.</p>
                                                                <p className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">{p.gazetteNumber || "—"}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${p.isModern ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
                                                        {formatNaira(p.isModern ? p.toSalary : p.salary || "0")}
                                                    </p>
                                                    <p className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">Post-Action Salary</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
