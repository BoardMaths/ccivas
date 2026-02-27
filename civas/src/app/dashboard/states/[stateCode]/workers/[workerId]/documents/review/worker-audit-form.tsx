"use client";

import { useState, useMemo } from "react";
import { DocumentType, Worker, Document, Promotion, AcademicCertificate } from "@prisma/client";
import { auditWorkerProfile } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { fetchSalaryAction } from "@/lib/salary-actions";
import { formatNaira } from "@/lib/salary-utils";
import { useEffect } from "react";

interface WorkerAuditFormProps {
    worker: Worker & {
        documents: Document[],
        promotions: Promotion[],
        certificates: AcademicCertificate[],
        leaveRecords: any[],
        careerActions: any[],
        cadre: any
    };
    stateCode: string;
    cadres: any[];
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    BIRTH_CERTIFICATE_AGE_DECLARATION: "Birth Certificate / Declaration of Age",
    NOTIFICATION_OF_APPOINTMENT: "Notification of Appointment",
    CONVERSION_TO_PERMANENT_APPOINTMENT: "Conversion to Permanent Appointment",
    CONFIRMATION_OF_APPOINTMENT: "Confirmation of Appointment",
    NOTIFICATION_OF_PROMOTION: "Notification of Promotion",
    FIRST_SCHOOL_LEAVING_CERTIFICATE: "First School Leaving Certificate",
    SCHOOL_CERTIFICATE: "School Certificates",
    DEGREE_CERTIFICATE: "Degree Certificate",
    NYSC_CERTIFICATE: "NYSC Certificate",
    NIN_SLIP: "NIN Slip",
    GAZETTE_PUBLICATION: "Gazette Publication",
    OTHER: "Others",
};

export default function WorkerAuditForm({
    worker,
    stateCode,
    cadres
}: WorkerAuditFormProps) {
    const router = useRouter();

    // Aggregated AI Logic
    const initialData = useMemo(() => {
        let dob = worker.dob ? new Date(worker.dob).toISOString().split("T")[0] : "";
        let appointmentDate = worker.appointmentDate ? new Date(worker.appointmentDate).toISOString().split("T")[0] : "";
        let rank = worker.rank || "";
        let designation = worker.designation || "";
        let salaryScale = worker.salaryScale || "";
        let salaryAmount = worker.salaryAmount || "";
        let ministry = worker.ministry || "";
        let department = (worker as any).department || "";
        let nin = worker.nin || "";
        let firstName = worker.firstName || "";
        let lastName = worker.lastName || "";
        let middleName = worker.middleName || "";
        let gender = worker.gender || "";
        let placeOfBirth = worker.placeOfBirth || "";
        let stateOfOrigin = worker.stateOfOrigin || "";
        let step = worker.step || "";

        let nyscYear = worker.nyscYear || "";
        let nyscState = worker.nyscState || "";
        let nyscNumber = worker.nyscNumber || "";
        let nyscStatus = (worker as any).nyscStatus || "NONE";
        let highestQualification = (worker as any).highestQualification || "";

        let cadreId = (worker as any).cadreId || "";
        let appointmentType = (worker as any).appointmentType || "PERMANENT_PENSIONABLE";
        let isConfirmed = (worker as any).isConfirmed || false;
        let postTitle = (worker as any).postTitle || "";
        let postCode = (worker as any).postCode || "";

        // Smarter Logic: Find LATEST for career info
        const sortedByDate = [...worker.documents]
            .filter(d => d.extractedDate)
            .sort((a, b) => new Date(a.extractedDate!).getTime() - new Date(b.extractedDate!).getTime());

        const autoQuals: any[] = worker.certificates.map(c => ({
            type: c.type,
            institution: c.institution,
            year: c.year,
            certificateNumber: c.certificateNumber || ""
        }));

        sortedByDate.forEach(doc => {
            if (doc.type === "BIRTH_CERTIFICATE_AGE_DECLARATION" && doc.extractedDate) {
                dob = new Date(doc.extractedDate).toISOString().split("T")[0];
            }
            if (doc.type === "NOTIFICATION_OF_APPOINTMENT" && doc.extractedDate) {
                appointmentDate = new Date(doc.extractedDate).toISOString().split("T")[0];
            }

            const data = doc.extractedData as any;
            if (doc.type.includes("PROMOTION") || doc.type.includes("APPOINTMENT")) {
                if (data?.rank) rank = data.rank;
                if (data?.salary) salaryScale = data.salary;
                if (data?.designation) designation = data.designation;
                if (data?.ministry) ministry = data.ministry;
            }

            if (data?.nin) nin = data.nin;

            if (doc.type.includes("CERTIFICATE") || doc.type.includes("SCHOOL")) {
                // Check if already exists in autoQuals
                const exists = autoQuals.some(q => q.institution === data?.institution && q.year === (doc.extractedDate ? new Date(doc.extractedDate).getFullYear().toString() : ""));
                if (!exists) {
                    autoQuals.push({
                        type: DOCUMENT_TYPE_LABELS[doc.type],
                        institution: data?.institution || "",
                        year: doc.extractedDate ? new Date(doc.extractedDate).getFullYear().toString() : "",
                        certificateNumber: data?.document_id || ""
                    });
                }
            }
        });

        const initialPromotions = worker.promotions.map(p => ({
            date: new Date(p.date).toISOString().split("T")[0],
            gradeLevel: p.gradeLevel,
            designation: p.designation || "",
            salary: p.salary || ""
        }));

        return {
            firstName, lastName, middleName, dob, gender, placeOfBirth, stateOfOrigin,
            nin, appointmentDate, rank, designation, salaryScale, salaryAmount, ministry,
            nyscYear, nyscState, nyscNumber, nyscStatus, highestQualification,
            promotions: initialPromotions,
            certificates: autoQuals,
            cadreId, appointmentType, isConfirmed, postTitle, postCode, step,
            ministry, department
        };
    }, [worker]);

    const [form, setForm] = useState(initialData);
    const [salaryDetails, setSalaryDetails] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-fetch salary on GL/Step/Cadre change
    useEffect(() => {
        async function updateSalary() {
            // Need to extract numeric GL from "GL 07" format if user typed it that way
            const glMatch = form.rank.match(/\d+/);
            const gl = glMatch ? glMatch[0].padStart(2, '0') : "";
            const st = form.step.padStart(2, '0');

            if (gl && st) {
                const res = await fetchSalaryAction({
                    stateId: worker.stateId,
                    cadreId: form.cadreId || null,
                    gradeLevel: gl,
                    step: st
                });

                if (res.success && res.salary) {
                    setForm(prev => ({ ...prev, salaryAmount: res.salary.basicSalary.toString() }));
                    setSalaryDetails(res.salary);
                }
            }
        }
        updateSalary();
    }, [form.rank, form.step, form.cadreId, worker.stateId]);

    const handleAddPromotion = () => {
        setForm({
            ...form,
            promotions: [...form.promotions, { date: "", gradeLevel: "", designation: "", salary: "" }]
        });
    };

    const handleRemovePromotion = (index: number) => {
        const newPromotions = [...form.promotions];
        newPromotions.splice(index, 1);
        setForm({ ...form, promotions: newPromotions });
    };

    const handleAddCertificate = () => {
        setForm({
            ...form,
            certificates: [...form.certificates, { type: "", institution: "", year: "", certificateNumber: "" }]
        });
    };

    const handleRemoveCertificate = (index: number) => {
        const newCertificates = [...form.certificates];
        newCertificates.splice(index, 1);
        setForm({ ...form, certificates: newCertificates });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");

            const result = await auditWorkerProfile(worker.id, {
                ...form,
                fullName,
                verifiedDocumentIds: worker.documents.map(d => d.id),
            });

            if (result.success) {
                router.push(`/dashboard/states/${stateCode}/workers/${worker.id}/documents`);
                router.refresh();
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Failed to save audit results");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Document Reference Strip - Scrollable */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {worker.documents.map(doc => (
                    <div key={doc.id} className="relative group shrink-0 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 overflow-hidden shadow-sm hover:border-blue-500/50 transition-all">
                        <img src={doc.url} alt={doc.type} className="w-full h-32 object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="mt-2">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">{DOCUMENT_TYPE_LABELS[doc.type]}</p>
                            <p className="text-xs truncate font-medium text-zinc-900 dark:text-zinc-100">{doc.name || "Document"}</p>
                        </div>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 p-1.5 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                        </a>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Review & Edit Worker Profile</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 uppercase font-bold tracking-widest text-[10px]">Verification & Audit Stage</p>
                </div>

                <div className="p-8 space-y-12">
                    {/* Worker Information */}
                    <section>
                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            Worker Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">First Name *</label>
                                <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Middle Name</label>
                                <input type="text" value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Last Name *</label>
                                <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Date of Birth</label>
                                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Gender</label>
                                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Place of Birth</label>
                                <input type="text" value={form.placeOfBirth} onChange={e => setForm({ ...form, placeOfBirth: e.target.value })} placeholder="City, State" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">State of Origin</label>
                                <input type="text" value={form.stateOfOrigin} onChange={e => setForm({ ...form, stateOfOrigin: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                        </div>
                    </section>

                    {/* Identity */}
                    <section>
                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            Identity
                        </h3>
                        <div className="max-w-md">
                            <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">NIN (National Identity Number)</label>
                            <input type="text" value={form.nin} onChange={e => setForm({ ...form, nin: e.target.value })} placeholder="11-digit NIN" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                    </section>

                    {/* Appointment */}
                    <section>
                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            Appointment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Appointment Date</label>
                                <input type="date" value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Grade Level</label>
                                <input type="text" value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} placeholder="e.g. 07" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Step</label>
                                <input type="text" value={form.step} onChange={e => setForm({ ...form, step: e.target.value })} placeholder="e.g. 01" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Designation</label>
                                <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Administrative Officer II" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Salary Scale / Structure</label>
                                <input type="text" value={form.salaryScale} onChange={e => setForm({ ...form, salaryScale: e.target.value })} placeholder="e.g. CONPSS" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Post Title (Operational)</label>
                                <input type="text" value={form.postTitle} onChange={e => setForm({ ...form, postTitle: e.target.value })} placeholder="e.g. Head of Unit" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Post Code (Establishment)</label>
                                <input type="text" value={form.postCode} onChange={e => setForm({ ...form, postCode: e.target.value })} placeholder="e.g. EST/ADM/001" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Basic Salary</label>
                                <input type="text" value={form.salaryAmount} onChange={e => setForm({ ...form, salaryAmount: e.target.value })} placeholder="e.g. ₦85,000" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Ministry</label>
                                <input type="text" value={form.ministry} onChange={e => setForm({ ...form, ministry: e.target.value })} placeholder="e.g. Ministry of Works" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Department</label>
                                <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Finance & Accounts" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Professional Cadre</label>
                                <select value={form.cadreId} onChange={e => setForm({ ...form, cadreId: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    <option value="">General / None</option>
                                    {cadres.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Appointment Type</label>
                                <select value={form.appointmentType} onChange={e => setForm({ ...form, appointmentType: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    <option value="PERMANENT_PENSIONABLE">Permanent & Pensionable</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="TEMPORARY">Temporary</option>
                                    <option value="PROBATION">Probationary</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <input
                                    type="checkbox"
                                    id="isConfirmed"
                                    checked={form.isConfirmed}
                                    onChange={(e) => setForm({ ...form, isConfirmed: e.target.checked })}
                                    className="h-5 w-5 rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isConfirmed" className="text-xs font-black uppercase text-zinc-400">
                                    Appointment Confirmed
                                </label>
                            </div>
                        </div>

                        {/* Salary Breakdown Display */}
                        {salaryDetails && (
                            <div className="mt-8 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-widest">Monthly Salary Breakdown</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase">Basic</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatNaira(salaryDetails.basicSalary)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase">Allowances</p>
                                        <p className="text-sm font-black text-blue-600">+{formatNaira(Number(salaryDetails.grossSalary) - Number(salaryDetails.basicSalary))}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase">Gross</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatNaira(salaryDetails.grossSalary)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase">Net (Est.)</p>
                                        <p className="text-sm font-black text-emerald-600">{formatNaira(salaryDetails.netSalary)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Promotion History */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                                Promotion History
                            </h3>
                            <button type="button" onClick={handleAddPromotion} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 dark:border-blue-800">
                                + Add Promotion
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.promotions.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs italic">
                                    No promotion history added. Click "Add Promotion" to document career growth.
                                </div>
                            )}
                            {form.promotions.map((p, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 relative group">
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Date</label>
                                        <input type="date" value={p.date} onChange={e => {
                                            const newP = [...form.promotions];
                                            newP[i].date = e.target.value;
                                            setForm({ ...form, promotions: newP });
                                        }} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Grade Level</label>
                                        <input type="text" value={p.gradeLevel} onChange={e => {
                                            const newP = [...form.promotions];
                                            newP[i].gradeLevel = e.target.value;
                                            setForm({ ...form, promotions: newP });
                                        }} placeholder="GL 08" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Designation</label>
                                        <input type="text" value={p.designation} onChange={e => {
                                            const newP = [...form.promotions];
                                            newP[i].designation = e.target.value;
                                            setForm({ ...form, promotions: newP });
                                        }} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">New Salary</label>
                                        <input type="text" value={p.salary} onChange={e => {
                                            const newP = [...form.promotions];
                                            newP[i].salary = e.target.value;
                                            setForm({ ...form, promotions: newP });
                                        }} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <button type="button" onClick={() => handleRemovePromotion(i)} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* NYSC & Education */}
                    <section>
                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            NYSC & Education
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Highest Qualification</label>
                                <select value={form.highestQualification} onChange={e => setForm({ ...form, highestQualification: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    <option value="">Select Qualification</option>
                                    <option value="PHD">PhD</option>
                                    <option value="MSC">M.Sc / M.A</option>
                                    <option value="BSC">B.Sc / B.A</option>
                                    <option value="HND">HND</option>
                                    <option value="OND">OND</option>
                                    <option value="NCE">NCE</option>
                                    <option value="SSCE">SSCE / WAEC</option>
                                    <option value="FSLC">FSLC</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">NYSC Status</label>
                                <select value={form.nyscStatus} onChange={e => setForm({ ...form, nyscStatus: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    <option value="NONE">None / Not Required</option>
                                    <option value="DISCHARGED">Discharged</option>
                                    <option value="EXEMPTED">Exempted</option>
                                    <option value="EXCLUDED">Excluded</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Year of Service</label>
                                <input type="text" value={form.nyscYear} onChange={e => setForm({ ...form, nyscYear: e.target.value })} placeholder="e.g. 2018" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">State of Service</label>
                                <input type="text" value={form.nyscState} onChange={e => setForm({ ...form, nyscState: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Certificate Number</label>
                                <input type="text" value={form.nyscNumber} onChange={e => setForm({ ...form, nyscNumber: e.target.value })} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                        </div>
                    </section>

                    {/* Academic Certificates */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                                School Certificates
                            </h3>
                            <button type="button" onClick={handleAddCertificate} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 dark:border-blue-800">
                                + Add Certificate
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.certificates.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs italic">
                                    No educational certificates added.
                                </div>
                            )}
                            {form.certificates.map((c, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 relative group">
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Type</label>
                                        <input type="text" value={c.type} onChange={e => {
                                            const newC = [...form.certificates];
                                            newC[i].type = e.target.value;
                                            setForm({ ...form, certificates: newC });
                                        }} placeholder="B.Sc, WAEC, etc." className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Institution</label>
                                        <input type="text" value={c.institution} onChange={e => {
                                            const newC = [...form.certificates];
                                            newC[i].institution = e.target.value;
                                            setForm({ ...form, certificates: newC });
                                        }} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Year</label>
                                        <input type="text" value={c.year} onChange={e => {
                                            const newC = [...form.certificates];
                                            newC[i].year = e.target.value;
                                            setForm({ ...form, certificates: newC });
                                        }} placeholder="2015" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">Certificate Number</label>
                                        <input type="text" value={c.certificateNumber} onChange={e => {
                                            const newC = [...form.certificates];
                                            newC[i].certificateNumber = e.target.value;
                                            setForm({ ...form, certificates: newC });
                                        }} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs" />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveCertificate(i)} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 font-medium">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest max-w-sm">
                        Verification of this profile creates a legal baseline for the Truth Engine audit against civil service rules.
                    </p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-2xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-12 py-3 text-xs font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                                    Saving Audit...
                                </>
                            ) : "Save & Finalize Profile"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
