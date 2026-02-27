"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorker } from "@/lib/actions";
import { fetchSalaryAction } from "@/lib/salary-actions";
import { formatNaira, calculateSalary } from "@/lib/salary-utils";
import Link from "next/link";

export default function AddWorkerForm({ state, cadres }: { state: any; cadres: any[] }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form State
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [cadreId, setCadreId] = useState("");
    const [gradeLevel, setGradeLevel] = useState("08");
    const [step, setStep] = useState("01");
    const [designation, setDesignation] = useState("");
    const [dateOfFirstAppointment, setDateOfFirstAppointment] = useState("");
    const [dateOfPresentAppointment, setDateOfPresentAppointment] = useState("");
    const [highestQualification, setHighestQualification] = useState("BSC");
    const [nyscStatus, setNyscStatus] = useState("NONE");
    const [nyscYear, setNyscYear] = useState("");
    const [nyscState, setNyscState] = useState("");
    const [nyscNumber, setNyscNumber] = useState("");
    const [calculatedSalary, setCalculatedSalary] = useState("0");

    // Personal Details
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    const [placeOfBirth, setPlaceOfBirth] = useState("");
    const [stateOfOrigin, setStateOfOrigin] = useState("");
    const [lgaOfOrigin, setLgaOfOrigin] = useState("");
    const [phone, setPhone] = useState("");
    const [nin, setNin] = useState("");

    // Registry & Administrative
    const [fileNumber, setFileNumber] = useState("");
    const [ippisNumber, setIppisNumber] = useState("");
    const [appointmentType, setAppointmentType] = useState("PROBATION");
    const [postTitle, setPostTitle] = useState("");
    const [postCode, setPostCode] = useState("");
    const [ministry, setMinistry] = useState("");
    const [department, setDepartment] = useState("");

    // Confirmation
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [confirmationDate, setConfirmationDate] = useState("");
    const [confirmationGradeLevel, setConfirmationGradeLevel] = useState("");
    const [confirmationStep, setConfirmationStep] = useState("");
    const [confirmationLetterRef, setConfirmationLetterRef] = useState("");

    // Sanctions
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspensionDate, setSuspensionDate] = useState("");
    const [suspensionReason, setSuspensionReason] = useState("");
    const [lastStepIncrementDate, setLastStepIncrementDate] = useState("");

    // Financial
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bvn, setBvn] = useState("");
    const [pfaName, setPfaName] = useState("");
    const [rsaNumber, setRsaNumber] = useState("");

    // Medical
    const [bloodGroup, setBloodGroup] = useState("");
    const [genotype, setGenotype] = useState("");

    // Next of Kin
    const [nextOfKinName, setNextOfKinName] = useState("");
    const [nextOfKinRelationship, setNextOfKinRelationship] = useState("");
    const [nextOfKinPhone, setNextOfKinPhone] = useState("");
    const [residentialAddress, setResidentialAddress] = useState("");

    const [certificates, setCertificates] = useState<any[]>([]);
    const [promotions, setPromotions] = useState<any[]>([]);

    const addCertificate = () => {
        setCertificates([...certificates, { type: "", institution: "", year: "", certificateNumber: "" }]);
    };

    const removeCertificate = (index: number) => {
        setCertificates(certificates.filter((_, i) => i !== index));
    };

    const updateCertificate = (index: number, field: string, value: string) => {
        const newCerts = [...certificates];
        newCerts[index] = { ...newCerts[index], [field]: value };
        setCertificates(newCerts);
    };

    // Auto-calculate salary
    useEffect(() => {
        async function updateSalary() {
            if (gradeLevel && step) {
                const res = await fetchSalaryAction({
                    stateId: state.id,
                    cadreId: cadreId || null,
                    gradeLevel,
                    step
                });
                if (res.success && res.salary) {
                    setCalculatedSalary(res.salary.basicSalary.toString());
                } else {
                    // Fallback to legacy calculation
                    const legacySalary = calculateSalary(gradeLevel, step, "CORE");
                    setCalculatedSalary(legacySalary.toString());
                }
            }
        }
        updateSalary();
    }, [gradeLevel, step, cadreId, state.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const result = await createWorker({
            firstName,
            middleName,
            lastName,
            stateId: state.id,
            cadreId: cadreId || undefined,
            gradeLevel,
            step,
            designation,
            dateOfFirstAppointment,
            dateOfPresentAppointment,
            highestQualification,
            nyscStatus: nyscStatus as "DISCHARGED" | "EXEMPTED" | "EXCLUDED" | "NONE",
            nyscYear,
            nyscState,
            nyscNumber,
            salaryAmount: calculatedSalary,

            // Personal
            dob,
            gender,
            maritalStatus,
            placeOfBirth,
            stateOfOrigin,
            lgaOfOrigin,
            phone,
            nin,

            // Administrative
            appointmentType,
            postTitle,
            postCode,
            ministry,
            department,
            fileNumber,
            ippisNumber,

            // Confirmation
            isConfirmed,
            dateOfConfirmation: confirmationDate,
            confirmationGradeLevel,
            confirmationStep,
            confirmationLetterRef,

            // Sanctions
            isSuspended,
            suspensionDate,
            suspensionReason,
            lastStepIncrementDate,

            // Financial
            bankName,
            accountNumber,
            bvn,
            pfaName,
            rsaNumber,

            // Medical
            bloodGroup,
            genotype,

            // Next of Kin
            nextOfKinName,
            nextOfKinRelationship,
            nextOfKinPhone,
            residentialAddress,
            certificates,
        });

        if (result.success && result.worker) {
            setMessage({ type: "success", text: "Personnel registered successfully!" });
            setTimeout(() => router.push(`/dashboard/states/${state.code}/workers/${result.worker.id}`), 1000);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to register personnel" });
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Personal Information */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Personal Identity</h2>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Legal Information</p>
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

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
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

            {/* Registry & Administrative */}
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

            {/* Employment Details */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M9 21V10" /><path d="M15 21V10" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Entry Information</h2>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rank & Salary Placement</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Professional Cadre</label>
                            <select value={cadreId} onChange={(e) => setCadreId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none">
                                <option value="">General Service / Not Specified</option>
                                {cadres?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Entry Grade Level</label>
                                <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                    {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                                        <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Entry Step</label>
                                <select value={step} onChange={(e) => setStep(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                    {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                                        <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Appointment Type</label>
                            <select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                <option value="PERMANENT_PENSIONABLE">Permanent & Pensionable</option>
                                <option value="PROBATION">Probationary</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="TEMPORARY">Temporary</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ministry</label>
                                <input placeholder="e.g. Ministry of Finance" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Department</label>
                                <input placeholder="e.g. Administration" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Designation</label>
                            <input placeholder="e.g. Admin Officer II" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Official Post Title</label>
                                <input placeholder="e.g. Head of Unit" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Establishment Post Code</label>
                                <input placeholder="e.g. EST/ADM/001" value={postCode} onChange={(e) => setPostCode(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date of 1st Appt</label>
                                <input required type="date" value={dateOfFirstAppointment} onChange={(e) => setDateOfFirstAppointment(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date of Present Appt</label>
                                <input required type="date" value={dateOfPresentAppointment} onChange={(e) => setDateOfPresentAppointment(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Highest Qualification</label>
                                <select value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                    <option value="FSLC">Primary (FSLC)</option>
                                    <option value="SSCE">Secondary (SSCE/WAEC)</option>
                                    <option value="OND">Diploma (OND/ND)</option>
                                    <option value="HND">Higher Diploma (HND)</option>
                                    <option value="BSC">Degree (BSc/BA/BEng)</option>
                                    <option value="MSC">Masters (MSc/MA)</option>
                                    <option value="PHD">Doctorate (PhD)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NYSC Status</label>
                                <select value={nyscStatus} onChange={(e) => setNyscStatus(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                                    <option value="NONE">Not Completed</option>
                                    <option value="DISCHARGED">Discharged</option>
                                    <option value="EXEMPTED">Exempted</option>
                                    <option value="EXCLUDED">Excluded</option>
                                </select>
                            </div>
                        </div>

                        {nyscStatus !== "NONE" && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NYSC Year</label>
                                    <input placeholder="e.g. 2020" value={nyscYear} onChange={(e) => setNyscYear(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NYSC State</label>
                                    <input placeholder="e.g. Lagos" value={nyscState} onChange={(e) => setNyscState(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NYSC Number</label>
                                    <input placeholder="e.g. NYSC/EB/20/1234" value={nyscNumber} onChange={(e) => setNyscNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                                </div>
                            </div>
                        )}

                        <div className="p-8 rounded-[2rem] bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex justify-between items-center shadow-2xl">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Calculated Basic Salary</p>
                                <p className="text-3xl font-black tracking-tighter">{formatNaira(calculatedSalary)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full border border-zinc-700 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            </div>
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
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Confirmation Details</h2>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confirmation GL</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confirmation Letter Reference</label>
                                <input placeholder="e.g. EB/CONF/1234/VOL.I" value={confirmationLetterRef} onChange={(e) => setConfirmationLetterRef(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Academic & Professional Certificates */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Academic Certificates</h2>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Qualifications & Credentials</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={addCertificate}
                        className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add New
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {certificates.map((cert, idx) => (
                        <div key={idx} className="relative p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 group">
                            <button
                                type="button"
                                onClick={() => removeCertificate(idx)}
                                className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Certificate Type</label>
                                    <input placeholder="e.g. B.Sc Comp Sci" value={cert.type} onChange={(e) => updateCertificate(idx, 'type', e.target.value)} className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Institution</label>
                                    <input placeholder="e.g. University of Lagos" value={cert.institution} onChange={(e) => updateCertificate(idx, 'institution', e.target.value)} className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Year Obtained</label>
                                    <input placeholder="2018" value={cert.year} onChange={(e) => updateCertificate(idx, 'year', e.target.value)} className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Certificate No.</label>
                                    <input placeholder="123456" value={cert.certificateNumber} onChange={(e) => updateCertificate(idx, 'certificateNumber', e.target.value)} className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {certificates.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 border-4 border-dashed border-zinc-50 dark:border-zinc-900 rounded-[2rem]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                            <p className="text-sm font-black uppercase tracking-widest">No Certificates Added</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Financial & Banking */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Financial & Banking</h2>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Payroll & Pension Setup</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bank Name</label>
                        <input placeholder="e.g. Zenith Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Account Number</label>
                        <input maxLength={10} placeholder="10 digits" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">BVN</label>
                        <input maxLength={11} placeholder="11 digits" value={bvn} onChange={(e) => setBvn(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PFA Name</label>
                        <input placeholder="e.g. Stanbic IBTC Pension" value={pfaName} onChange={(e) => setPfaName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">RSA Number</label>
                        <input placeholder="e.g. PEN100..." value={rsaNumber} onChange={(e) => setRsaNumber(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                    </div>
                </div>
            </section>

            {/* Contact & Medical */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Residential & Next of Kin</h2>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Emergency Contacts & Home Address</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Residential Address</label>
                            <textarea rows={3} value={residentialAddress} onChange={(e) => setResidentialAddress(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Next of Kin Name</label>
                            <input value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Relationship</label>
                                <input placeholder="e.g. Spouse" value={nextOfKinRelationship} onChange={(e) => setNextOfKinRelationship(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NoK Phone</label>
                                <input value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sanctions & Disciplines */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Sanctions & High Risks</h2>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Disciplinary Actions & Holds</p>
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
                            <p className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Personnel is Under Suspension</p>
                            <p className="text-xs font-bold text-red-700/60 dark:text-red-400/40">Check this if the staff is currently on interdiction or hold</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isSuspended && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Suspension Date</label>
                                    <input type="date" value={suspensionDate} onChange={(e) => setSuspensionDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Suspension Reason</label>
                                    <textarea placeholder="Specify the reason for disciplinary action..." value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:outline-none min-h-[100px]" />
                                </div>
                            </div>
                        )}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Step Increment Date</label>
                                <input type="date" value={lastStepIncrementDate} onChange={(e) => setLastStepIncrementDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Notice</p>
                                <p className="text-xs font-bold text-zinc-500">Suspended personnel will be automatically flagged in audit reports and exempt from payroll processing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {
                message && (
                    <div className={`p-8 rounded-[2rem] font-bold flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'} border-2 ${message.type === 'success' ? 'border-emerald-100' : 'border-red-100'}`}>
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {message.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            )}
                        </div>
                        {message.text}
                    </div>
                )
            }

            <button
                disabled={isLoading}
                className="w-full py-6 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
            >
                {isLoading ? "Validating & Profiling..." : "Register Personnel Profile"}
            </button>
        </form >
    );
}
