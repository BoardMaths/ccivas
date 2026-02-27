"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateWorker } from "@/lib/actions";
import { uploadFile } from "@/lib/file-upload";
import { formatNaira, calculateSalary } from "@/lib/salary-utils";
import { fetchSalaryAction } from "@/lib/salary-actions";
import Link from "next/link";

interface PromotionEntry {
    date: string;
    gradeLevel: string;
    step: string;
    designation: string;
    salary: string;
    authorityReference: string;
    gazetteNumber: string;
}

interface CertificateEntry {
    type: string;
    institution: string;
    year: string;
    certificateNumber: string;
}

export default function EditWorkerForm({ worker, cadres, states }: { worker: any; cadres: any[]; states: any[] }) {
    const params = useParams();
    const router = useRouter();
    const stateCode = params.stateCode as string;
    const workerId = params.workerId as string;

    const [firstName, setFirstName] = useState(worker.firstName || "");
    const [middleName, setMiddleName] = useState(worker.middleName || "");
    const [lastName, setLastName] = useState(worker.lastName || "");
    const [dob, setDob] = useState(worker.dob ? new Date(worker.dob).toISOString().split('T')[0] : "");
    const [gender, setGender] = useState(worker.gender || "");
    const [maritalStatus, setMaritalStatus] = useState(worker.maritalStatus || "");
    const [placeOfBirth, setPlaceOfBirth] = useState(worker.placeOfBirth || "");
    const [stateOfOrigin, setStateOfOrigin] = useState(worker.stateOfOrigin || "");
    const [lgaOfOrigin, setLgaOfOrigin] = useState(worker.lgaOfOrigin || "");
    const [phone, setPhone] = useState(worker.phone || "");

    const [nin, setNin] = useState(worker.nin || "");

    const [appointmentDate, setAppointmentDate] = useState(worker.dateOfFirstAppointment ? new Date(worker.dateOfFirstAppointment).toISOString().split('T')[0] : "");
    const [entryGradeLevel, setEntryGradeLevel] = useState(worker.entryGradeLevel || "");
    const [entryStep, setEntryStep] = useState(worker.entryStep || "");
    const [confirmationDate, setConfirmationDate] = useState(worker.dateOfConfirmation ? new Date(worker.dateOfConfirmation).toISOString().split('T')[0] : "");
    const [confirmationGradeLevel, setConfirmationGradeLevel] = useState(worker.confirmationGradeLevel || "");
    const [confirmationStep, setConfirmationStep] = useState(worker.confirmationStep || "");
    const [confirmationLetterRef, setConfirmationLetterRef] = useState(worker.confirmationLetterRef || "");
    const [gradeLevel, setGradeLevel] = useState(worker.gradeLevel || "");
    const [step, setStep] = useState(worker.step || "");
    const [presentAppointmentDate, setPresentAppointmentDate] = useState(worker.dateOfPresentAppointment ? new Date(worker.dateOfPresentAppointment).toISOString().split('T')[0] : "");
    const [designation, setDesignation] = useState(worker.designation || "");
    const [salaryScale, setSalaryScale] = useState(worker.salaryScale || "CORE");
    const [salaryAmount, setSalaryAmount] = useState(worker.salaryAmount || "");
    const [ministry, setMinistry] = useState(worker.ministry || "");
    const [department, setDepartment] = useState(worker.department || "");

    // Enhanced Fields
    const [cadreId, setCadreId] = useState(worker.cadreId || "");
    const [appointmentType, setAppointmentType] = useState(worker.appointmentType || "PERMANENT_PENSIONABLE");
    const [isConfirmed, setIsConfirmed] = useState(worker.isConfirmed || false);
    const [postTitle, setPostTitle] = useState(worker.postTitle || "");
    const [postCode, setPostCode] = useState(worker.postCode || "");
    const [salaryDetails, setSalaryDetails] = useState<any>(null);

    const [highestQualification, setHighestQualification] = useState(worker.highestQualification || "");
    const [nyscStatus, setNyscStatus] = useState(worker.nyscStatus || "NONE");
    const [nyscYear, setNyscYear] = useState(worker.nyscYear || "");
    const [nyscState, setNyscState] = useState(worker.nyscState || "");
    const [nyscNumber, setNyscNumber] = useState(worker.nyscNumber || "");

    const [isSuspended, setIsSuspended] = useState(worker.isSuspended || false);
    const [suspensionDate, setSuspensionDate] = useState(worker.suspensionDate ? new Date(worker.suspensionDate).toISOString().split('T')[0] : "");
    const [suspensionReason, setSuspensionReason] = useState(worker.suspensionReason || "");
    const [lastStepIncrementDate, setLastStepIncrementDate] = useState(worker.lastStepIncrementDate ? new Date(worker.lastStepIncrementDate).toISOString().split('T')[0] : "");

    // Registry & Administrative
    const [fileNumber, setFileNumber] = useState(worker.fileNumber || "");
    const [ippisNumber, setIppisNumber] = useState(worker.ippisNumber || "");

    // Financial
    const [bvn, setBvn] = useState(worker.bvn || "");
    const [accountNumber, setAccountNumber] = useState(worker.accountNumber || "");
    const [bankName, setBankName] = useState(worker.bankName || "");
    const [pfaName, setPfaName] = useState(worker.pfaName || "");
    const [rsaNumber, setRsaNumber] = useState(worker.rsaNumber || "");

    // Medical
    const [bloodGroup, setBloodGroup] = useState(worker.bloodGroup || "");
    const [genotype, setGenotype] = useState(worker.genotype || "");

    // Next of Kin & Address
    const [nextOfKinName, setNextOfKinName] = useState(worker.nextOfKinName || "");
    const [nextOfKinRelationship, setNextOfKinRelationship] = useState(worker.nextOfKinRelationship || "");
    const [nextOfKinPhone, setNextOfKinPhone] = useState(worker.nextOfKinPhone || "");
    const [residentialAddress, setResidentialAddress] = useState(worker.residentialAddress || "");

    const [promotions, setPromotions] = useState<PromotionEntry[]>(worker.promotions?.map((p: any) => ({
        date: p.date ? new Date(p.date).toISOString().split('T')[0] : "",
        gradeLevel: p.gradeLevel || "",
        step: p.step || "",
        designation: p.designation || "",
        salary: p.salary || "",
        authorityReference: p.authorityReference || "",
        gazetteNumber: p.gazetteNumber || ""
    })) || []);

    const [certificates, setCertificates] = useState<CertificateEntry[]>(worker.certificates?.map((c: any) => ({
        type: c.type || "",
        institution: c.institution || "",
        year: c.year || "",
        certificateNumber: c.certificateNumber || ""
    })) || []);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(worker.imageUrl || null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const addPromotion = () => {
        setPromotions([...promotions, { date: "", gradeLevel: "", step: "", designation: "", salary: "", authorityReference: "", gazetteNumber: "" }]);
    };

    const removePromotion = (index: number) => {
        setPromotions(promotions.filter((_, i) => i !== index));
    };

    const updatePromotion = (index: number, field: keyof PromotionEntry, value: string) => {
        const newPromotions = [...promotions];
        newPromotions[index] = { ...newPromotions[index], [field]: value };
        setPromotions(newPromotions);
    };

    const addCertificate = () => {
        setCertificates([...certificates, { type: "", institution: "", year: "", certificateNumber: "" }]);
    };

    const removeCertificate = (index: number) => {
        setCertificates(certificates.filter((_, i) => i !== index));
    };

    const updateCertificate = (index: number, field: keyof CertificateEntry, value: string) => {
        const newCertificates = [...certificates];
        newCertificates[index] = { ...newCertificates[index], [field]: value };
        setCertificates(newCertificates);
    };

    // Auto-calculate main salary whenever GL, Step or Scale changes
    useEffect(() => {
        async function updateSalary() {
            if (gradeLevel && step) {
                const res = await fetchSalaryAction({
                    stateId: worker.stateId,
                    cadreId: cadreId || null,
                    gradeLevel,
                    step
                });

                if (res.success && res.salary) {
                    setSalaryAmount(res.salary.basicSalary.toString());
                    setSalaryDetails(res.salary);
                } else {
                    // Fallback to legacy calculation if DB fails
                    const legacySalary = calculateSalary(gradeLevel, step, salaryScale);
                    setSalaryAmount(legacySalary.toString());
                    setSalaryDetails(null);
                }
            }
        }
        updateSalary();
    }, [gradeLevel, step, cadreId, worker.stateId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            let imageUrl = worker.imageUrl;

            if (imageFile) {
                try {
                    const uploadResult = await uploadFile(imageFile, { folder: "workers" });
                    imageUrl = uploadResult.url;
                } catch (uploadError) {
                    setMessage({
                        type: "error",
                        text: "Failed to upload profile photo. Updating profile with existing image.",
                    });
                }
            }

            const result = await updateWorker(workerId, {
                firstName,
                middleName,
                lastName,
                dob,
                gender,
                maritalStatus,
                placeOfBirth,
                stateOfOrigin,
                lgaOfOrigin,
                phone,
                nin,
                dateOfFirstAppointment: appointmentDate,
                entryGradeLevel,
                entryStep,
                dateOfPresentAppointment: presentAppointmentDate,
                dateOfConfirmation: confirmationDate,
                confirmationGradeLevel,
                confirmationStep,
                confirmationLetterRef,
                gradeLevel,
                step,
                designation,
                salaryScale,
                salaryAmount,
                ministry,
                department,
                highestQualification,
                nyscStatus,
                nyscYear,
                nyscState,
                nyscNumber,
                isSuspended,
                suspensionDate,
                suspensionReason,
                lastStepIncrementDate,
                imageUrl,

                // Enhanced Fields
                cadreId,
                appointmentType,
                isConfirmed,
                postTitle,
                postCode,

                // Registry & Administrative
                fileNumber,
                ippisNumber,

                // Financial
                bvn,
                accountNumber,
                bankName,
                pfaName,
                rsaNumber,

                // Medical
                bloodGroup,
                genotype,

                // Next of Kin & Address
                nextOfKinName,
                nextOfKinRelationship,
                nextOfKinPhone,
                residentialAddress,

                promotions,
                certificates,
            });

            if (result.success) {
                setMessage({ type: "success", text: "Worker profile updated successfully!" });
                router.push(`/dashboard/states/${stateCode}/workers/${workerId}`);
            } else {
                setMessage({ type: "error", text: (result.error as string) || "Failed to update worker" });
            }
        } catch (error) {
            console.error("Submit Error:", error);
            setMessage({ type: "error", text: "An unexpected error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-20 dark:bg-zinc-950/50">
            <div className="mx-auto max-w-4xl px-6 pt-8">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <Link
                            href={`/dashboard/states/${stateCode}/workers/${workerId}`}
                            className="group mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Profile
                        </Link>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">Refine Personnel Profile</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Updating records for {worker.firstName} {worker.lastName} — all changes are logged for civil service audit.</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="rounded-[2rem] bg-zinc-900 px-10 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                    >
                        {isLoading ? "Saving Changes..." : "Sync Profile Changes"}
                    </button>
                </div>

                {worker.isFlagged && (
                    <div className="mb-8 rounded-3xl border-2 border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
                        <div className="mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <h3 className="text-sm font-black uppercase tracking-widest">Active Audit Flags</h3>
                        </div>
                        <ul className="space-y-2">
                            {worker.flagReason?.split(' | ').map((flag: string, idx: number) => (
                                <li key={idx} className="text-sm font-bold text-red-600 dark:text-red-300 leading-relaxed list-disc ml-5">
                                    {flag}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Identity */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Personal Identity</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Legal & Identity Records</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">First Name</label>
                                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Middle Name</label>
                                <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Name</label>
                                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date of Birth</label>
                                <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Gender</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Marital Status</label>
                                <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                    <option value="">Select...</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NIN</label>
                                <input maxLength={11} placeholder="11 digits" value={nin} onChange={(e) => setNin(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Place of Birth</label>
                                <input value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">State of Origin</label>
                                <input value={stateOfOrigin} onChange={(e) => setStateOfOrigin(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">LGA of Origin</label>
                                <input value={lgaOfOrigin} onChange={(e) => setLgaOfOrigin(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-10">
                            <div className="flex items-center gap-6 pb-4">
                                <div className="relative h-32 w-32 overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-900 shadow-inner">
                                    {imagePreview ? (
                                        <img src={imagePreview} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Passport Photo</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 tracking-tight max-w-[200px]">Official identification photo for digital staff records.</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white dark:text-zinc-900 hover:scale-105 transition-transform"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                        Upload New
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Medical Information */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Medical Information</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Health & Emergency Data</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Blood Group</label>
                                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:outline-none">
                                    <option value="">Select...</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Genotype</label>
                                <select value={genotype} onChange={(e) => setGenotype(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:outline-none">
                                    <option value="">Select...</option>
                                    <option value="AA">AA</option>
                                    <option value="AS">AS</option>
                                    <option value="AC">AC</option>
                                    <option value="SS">SS</option>
                                    <option value="SC">SC</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Identity & Registry */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M6.5 18H20" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Registry & Administrative</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Office Records & Payroll Identifiers</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Personnel File Number</label>
                                <input placeholder="e.g. EB/ADM/045" value={fileNumber} onChange={(e) => setFileNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">IPPIS / Payroll Number</label>
                                <input placeholder="e.g. 123456" value={ippisNumber} onChange={(e) => setIppisNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:outline-none" />
                            </div>
                        </div>
                    </section>

                    {/* First Appointment */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M9 21V10" /><path d="M15 21V10" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">First Appointment</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Initial Grade & Step At Deployment</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Original Appointment Date</label>
                                <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Grade Level at Appointment</label>
                                    <select value={entryGradeLevel} onChange={(e) => setEntryGradeLevel(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                                        <option value="">Select...</option>
                                        {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                                            <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Step at Appointment</label>
                                    <select value={entryStep} onChange={(e) => setEntryStep(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                                        <option value="">Select...</option>
                                        {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                                            <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Confirmation & Permanent Appointment */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Confirmation Information</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Permanent Appointment Setup</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4 p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isConfirmed}
                                        onChange={(e) => setIsConfirmed(e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Personnel is Confirmed</p>
                                    <p className="text-xs font-bold text-emerald-700/60 dark:text-emerald-400/40">Check this if the staff has completed probation</p>
                                </div>
                            </div>

                            {isConfirmed && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confirmation Date</label>
                                        <input type="date" value={confirmationDate} onChange={(e) => setConfirmationDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confirmation Grade Level</label>
                                        <select value={confirmationGradeLevel} onChange={(e) => setConfirmationGradeLevel(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                                            <option value="">Select Level</option>
                                            {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                                                <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confirmation Step</label>
                                        <select value={confirmationStep} onChange={(e) => setConfirmationStep(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                                            <option value="">Select Step</option>
                                            {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                                                <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Letter Reference Number</label>
                                        <input placeholder="e.g. EB/CONF/123" value={confirmationLetterRef} onChange={(e) => setConfirmationLetterRef(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Current Post & Salary Deployment */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Current Post & Deployment</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Service Details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Grade Level</label>
                                        <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none">
                                            <option value="">Select...</option>
                                            {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                                                <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Step</label>
                                        <select value={step} onChange={(e) => setStep(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none">
                                            <option value="">Select...</option>
                                            {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                                                <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Professional Cadre</label>
                                    <select value={cadreId} onChange={(e) => setCadreId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none">
                                        <option value="">General / None</option>
                                        {cadres.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Appointment Type</label>
                                    <select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none">
                                        <option value="PERMANENT_PENSIONABLE">Permanent & Pensionable</option>
                                        <option value="PROBATION">Probationary</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="TEMPORARY">Temporary</option>
                                        <option value="SECONDMENT">Secondment</option>
                                        <option value="ACTING">Acting Appointment</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Salary Scale</label>
                                    <select value={salaryScale} onChange={(e) => setSalaryScale(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none">
                                        <option value="CORE">Core Civil Servant (CONPSS)</option>
                                        <option value="SUBEB">SUBEB Staff</option>
                                        <option value="EXEC_AUDIT">Executive (Audit)</option>
                                        <option value="TEACHERS_NP">Teachers (Non-Professional)</option>
                                        <option value="TEACHERS_P">Teachers (Professional)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date of Present Appointment</label>
                                    <input type="date" value={presentAppointmentDate} onChange={(e) => setPresentAppointmentDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                                </div>

                                {salaryDetails && (
                                    <div className="rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60">Salary Breakdown</h4>
                                            <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Monthly</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-zinc-500">Basic Pay</span>
                                                <span className="text-zinc-900 dark:text-zinc-100">{formatNaira(salaryDetails.basicSalary)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-zinc-500">Total Allowances</span>
                                                <span className="text-emerald-600">+{formatNaira(salaryDetails.grossSalary - salaryDetails.basicSalary)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-baseline">
                                                <span className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase">Computed Net</span>
                                                <span className="text-xl font-black text-indigo-600 tracking-tight">{formatNaira(salaryDetails.netSalary)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ministry / MDA</label>
                                <input placeholder="e.g. Ministry of Education" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Department / Unit</label>
                                <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Designation</label>
                                <input placeholder="e.g. Administrative Officer II" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Official Post Title</label>
                                <input placeholder="e.g. Head of Unit" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Post Code</label>
                                <input placeholder="e.g. EST/ADM/001" value={postCode} onChange={(e) => setPostCode(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                            </div>
                        </div>
                    </section>

                    {/* Financial & Banking */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Financial & Banking</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Payroll & Pension Accounts</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bank Name</label>
                                <input placeholder="e.g. First Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Account Number</label>
                                <input placeholder="10 digits" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">BVN</label>
                                <input placeholder="11 digits" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PFA Name</label>
                                <input placeholder="e.g. Stanbic IBTC Pension" value={pfaName} onChange={(e) => setPfaName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">RSA Number</label>
                                <input placeholder="e.g. PEN12345678" value={rsaNumber} onChange={(e) => setRsaNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                        </div>
                    </section>


                    {/* Career Action History */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Career Action History</h2>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Previous Promotions & Postings</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addPromotion}
                                className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Promotion
                            </button>
                        </div>

                        <div className="space-y-6">
                            {promotions.map((promo, idx) => (
                                <div key={idx} className="relative rounded-[2rem] border border-zinc-100 bg-zinc-50/30 p-8 dark:border-zinc-800 dark:bg-zinc-800/20">
                                    <button
                                        type="button"
                                        onClick={() => removePromotion(idx)}
                                        className="absolute right-6 top-6 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Effective Date</label>
                                            <input type="date" value={promo.date} onChange={(e) => updatePromotion(idx, 'date', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Grade Level</label>
                                            <select value={promo.gradeLevel} onChange={(e) => updatePromotion(idx, 'gradeLevel', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none">
                                                <option value="">Select...</option>
                                                {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                                                    <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Step</label>
                                            <select value={promo.step} onChange={(e) => updatePromotion(idx, 'step', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none">
                                                <option value="">Select...</option>
                                                {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                                                    <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Designation</label>
                                            <input placeholder="e.g. Principal Officer" value={promo.designation} onChange={(e) => updatePromotion(idx, 'designation', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Authority Reference</label>
                                            <input placeholder="e.g. CSC/PROM/2024/001" value={promo.authorityReference} onChange={(e) => updatePromotion(idx, 'authorityReference', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Gazette Number</label>
                                            <input placeholder="e.g. Vol. 12 Page 45" value={promo.gazetteNumber} onChange={(e) => updatePromotion(idx, 'gazetteNumber', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {promotions.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-widest text-zinc-500">No Career Actions</p>
                                    <p className="text-xs font-bold text-zinc-400 mt-1">Actions are required for promotion audit</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Certificates */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Academic Certificates</h2>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Formal Qualifications & Training</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addCertificate}
                                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Certificate
                            </button>
                        </div>

                        <div className="space-y-6">
                            {certificates.map((cert, idx) => (
                                <div key={idx} className="relative rounded-[2rem] border border-zinc-100 bg-zinc-50/30 p-8 dark:border-zinc-800 dark:bg-zinc-800/20">
                                    <button
                                        type="button"
                                        onClick={() => removeCertificate(idx)}
                                        className="absolute right-6 top-6 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-2 lg:col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Certificate Type</label>
                                            <input placeholder="e.g. B.Sc Computer Science" value={cert.type} onChange={(e) => updateCertificate(idx, 'type', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                        </div>
                                        <div className="space-y-2 lg:col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Institution</label>
                                            <input placeholder="e.g. University of Lagos" value={cert.institution} onChange={(e) => updateCertificate(idx, 'institution', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Year Obtained</label>
                                            <input placeholder="e.g. 2018" value={cert.year} onChange={(e) => updateCertificate(idx, 'year', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                        </div>
                                        <div className="space-y-2 lg:col-span-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Certificate No.</label>
                                            <input placeholder="e.g. 123456" value={cert.certificateNumber} onChange={(e) => updateCertificate(idx, 'certificateNumber', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {certificates.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-widest text-zinc-500">No Certificates Recorded</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Education & NYSC */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Entry Information</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Education & National Service</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Highest Qualification</label>
                                <select value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-zinc-500/20 focus:outline-none">
                                    <option value="">Select...</option>
                                    <option value="PHD">PhD</option>
                                    <option value="MSC">Master's Degree (M.Sc/M.A)</option>
                                    <option value="BSC">First Degree (B.Sc/B.A/HND)</option>
                                    <option value="OND">National Diploma (OND/NCE)</option>
                                    <option value="SSCE">Secondary School (WASSCE/NECO)</option>
                                    <option value="FSLC">Primary School (FSLC)</option>
                                </select>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">NYSC Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NYSC Status</label>
                                        <select value={nyscStatus} onChange={(e) => setNyscStatus(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:outline-none">
                                            <option value="NONE">Not Completed / None</option>
                                            <option value="DISCHARGED">Discharged (Certificate)</option>
                                            <option value="EXEMPTED">Exempted</option>
                                            <option value="EXCLUDED">Excluded</option>
                                        </select>
                                    </div>
                                    {nyscStatus !== 'NONE' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300 md:col-span-2 lg:col-span-1">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Year</label>
                                                <input placeholder="e.g. 2015" value={nyscYear} onChange={(e) => setNyscYear(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">State</label>
                                                <input value={nyscState} onChange={(e) => setNyscState(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:outline-none" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Certificate/Letter Number</label>
                                                <input value={nyscNumber} onChange={(e) => setNyscNumber(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:outline-none" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Residential & Next of Kin */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Residential & Next of Kin</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Address & Emergency Contacts</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Residential Address</label>
                                <textarea rows={4} value={residentialAddress} onChange={(e) => setResidentialAddress(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-zinc-500/20 focus:outline-none resize-none" />
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Name (Next of Kin)</label>
                                    <input value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-zinc-500/20 focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Relationship</label>
                                        <input placeholder="e.g. Spouse" value={nextOfKinRelationship} onChange={(e) => setNextOfKinRelationship(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-zinc-500/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                                        <input value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-zinc-500/20 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sanctions & Disciplines */}
                    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Sanctions & Disciplines</h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Administrative Actions & Penalties</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4 p-6 rounded-3xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isSuspended}
                                        onChange={(e) => setIsSuspended(e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-zinc-600 peer-checked:bg-red-600"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Personnel is Suspended</p>
                                    <p className="text-xs font-bold text-red-700/60 dark:text-red-400/40">This will stop all salary calculations immediately</p>
                                </div>
                            </div>

                            {isSuspended && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Suspension Date</label>
                                        <input type="date" value={suspensionDate} onChange={(e) => setSuspensionDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Suspension Reason</label>
                                        <input placeholder="e.g. Pending investigation" value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:outline-none" />
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-2 max-w-sm">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Step Increment Date</label>
                                    <input type="date" value={lastStepIncrementDate} onChange={(e) => setLastStepIncrementDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                    <p className="text-[10px] text-zinc-400 font-bold leading-relaxed px-1">Next increment typically occurs annually on the anniversary of this date.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {
                        message && (
                            <div className={`rounded-3xl p-6 shadow-lg ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                    <p className="font-bold">{message.text}</p>
                                </div>
                            </div>
                        )
                    }

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Link
                            href={`/dashboard/states/${stateCode}/workers/${workerId}`}
                            className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-2xl bg-zinc-900 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-zinc-800 hover:shadow-2xl active:scale-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {isLoading ? "Saving..." : "Update Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}
