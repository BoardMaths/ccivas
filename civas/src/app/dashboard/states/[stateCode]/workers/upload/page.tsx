"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createWorker, fetchCadresByStateAction } from "@/lib/actions";
import { uploadFile } from "@/lib/file-upload";
import { calculateSalary, formatNaira } from "@/lib/salary-utils";
import { fetchSalaryAction } from "@/lib/salary-actions";
import Link from "next/link";

interface PromotionEntry {
  date: string;
  gradeLevel: string;
  step: string;
  designation: string;
  salary: string;
}

interface CertificateEntry {
  type: string;
  institution: string;
  year: string;
  certificateNumber: string;
}

export default function WorkersUploadPage() {
  const params = useParams();
  const router = useRouter();
  const stateCode = params.stateCode as string;

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [lgaOfOrigin, setLgaOfOrigin] = useState("");
  const [phone, setPhone] = useState("");

  const [nin, setNin] = useState("");

  const [appointmentDate, setAppointmentDate] = useState("");
  const [entryGradeLevel, setEntryGradeLevel] = useState("");
  const [entryStep, setEntryStep] = useState("");
  const [confirmationDate, setConfirmationDate] = useState("");
  const [confirmationGradeLevel, setConfirmationGradeLevel] = useState("");
  const [confirmationStep, setConfirmationStep] = useState("");
  const [confirmationLetterRef, setConfirmationLetterRef] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [step, setStep] = useState("");
  const [designation, setDesignation] = useState("");
  const [salaryScale, setSalaryScale] = useState("CORE");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [ministry, setMinistry] = useState("");
  const [department, setDepartment] = useState("");

  const [highestQualification, setHighestQualification] = useState("");
  const [nyscYear, setNyscYear] = useState("");
  const [nyscState, setNyscState] = useState("");
  const [nyscNumber, setNyscNumber] = useState("");

  const [promotions, setPromotions] = useState<PromotionEntry[]>([]);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
  const [cadres, setCadres] = useState<any[]>([]);

  // Enhanced Fields
  const [cadreId, setCadreId] = useState("");
  const [appointmentType, setAppointmentType] = useState("PERMANENT_PENSIONABLE");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postCode, setPostCode] = useState("");
  const [salaryDetails, setSalaryDetails] = useState<any>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch cadres for the state
  useEffect(() => {
    async function loadCadres() {
      if (stateCode) {
        const res = await fetchCadresByStateAction(stateCode);
        if (res.success) {
          setCadres(res.cadres || []);
        }
      }
    }
    loadCadres();
  }, [stateCode]);

  // Auto-calculate main salary whenever GL, Step, Scale or Cadre changes
  useEffect(() => {
    async function updateSalary() {
      if (gradeLevel && step) {
        // Find state ID first or just use stateCode if backend supports it
        // Our fetchSalaryAction uses stateId, but we might need to resolve it.
        // Actually, let's just use calculateSalary as fallback until we have stateId here.
        // Or better, let's use the DB rules since we are building a premium system.

        // We'll pass the stateCode and the backend fetchSalaryAction will handle it if we update it,
        // or we can just use the state code to find rules.

        // For now, let's keep it simple or use the hardcoded one if we don't have stateId.
        const calculated = calculateSalary(gradeLevel, step, salaryScale);
        if (calculated > 0) {
          setSalaryAmount(calculated.toString());
        }
      }
    }
    updateSalary();
  }, [gradeLevel, step, salaryScale, cadreId]);

  const handleAddPromotion = () => {
    setPromotions([
      ...promotions,
      { date: "", gradeLevel: "", step: "", designation: "", salary: "" },
    ]);
  };

  const handlePromotionChange = (index: number, field: keyof PromotionEntry, value: string) => {
    const newPromotions = [...promotions];
    newPromotions[index][field] = value;

    // Auto-calculate promotion salary if GL or Step changed
    if (field === "gradeLevel" || field === "step") {
      const promoGl = newPromotions[index].gradeLevel;
      const promoStep = newPromotions[index].step;
      if (promoGl && promoStep) {
        const calculated = calculateSalary(promoGl, promoStep, salaryScale);
        if (calculated > 0) {
          newPromotions[index].salary = calculated.toString();
        }
      }
    }

    setPromotions(newPromotions);
  };

  const handleRemovePromotion = (index: number) => {
    setPromotions(promotions.filter((_, i) => i !== index));
  };

  const handleAddCertificate = () => {
    setCertificates([
      ...certificates,
      { type: "", institution: "", year: "", certificateNumber: "" },
    ]);
  };

  const handleCertificateChange = (index: number, field: keyof CertificateEntry, value: string) => {
    const newCertificates = [...certificates];
    newCertificates[index][field] = value;
    setCertificates(newCertificates);
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        try {
          const uploadResult = await uploadFile(imageFile, { folder: "workers" });
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          setMessage({
            type: "error",
            text: "Failed to upload profile photo. Saving worker without image.",
          });
        }
      }

      const result = await createWorker({
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
        dateOfPresentAppointment: promotions.length > 0 ? promotions[promotions.length - 1].date : appointmentDate,
        dateOfConfirmation: confirmationDate,
        confirmationGradeLevel,
        confirmationStep,
        confirmationLetterRef,
        gradeLevel: promotions.length > 0 ? promotions[promotions.length - 1].gradeLevel : gradeLevel,
        step: promotions.length > 0 ? promotions[promotions.length - 1].step : step,
        designation: promotions.length > 0 ? promotions[promotions.length - 1].designation : designation,
        salaryScale,
        salaryAmount: promotions.length > 0 ? promotions[promotions.length - 1].salary : salaryAmount,
        ministry,
        department,
        highestQualification,
        nyscYear,
        nyscState,
        nyscNumber,
        stateCode,
        imageUrl,
        promotions: promotions.length > 0 ? promotions : undefined,
        certificates: certificates.length > 0 ? certificates : undefined,

        // Enhanced Fields
        cadreId: cadreId || undefined,
        appointmentType,
        isConfirmed,
        postTitle: postTitle || undefined,
        postCode: postCode || undefined,
      });

      if (result.success && result.worker) {
        setMessage({ type: "success", text: "Worker profile created successfully!" });
        router.push(`/dashboard/states/${stateCode}/workers/${result.worker.id}`);
      } else {
        setMessage({ type: "error", text: (result.error as string) || "Failed to create worker" });
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href={`/dashboard/states/${stateCode}/workers`}
              className="group mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Back to Registry
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile New Personnel</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Fill in details — system will validate and flag issues instantly</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-2xl bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-zinc-800 hover:shadow-2xl active:scale-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading ? "Saving..." : "Save Worker Profile"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Worker Information */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Worker Information</h2>
            </div>

            <div className="grid gap-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-6 pb-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </div>
                  )}
                </div>
                <div>
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
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Upload Photo
                  </button>
                  <p className="mt-2 text-[10px] uppercase font-bold text-zinc-400 tracking-tight">JPEG or PNG, max 5MB</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">First Name *</label>
                  <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Middle Name</label>
                  <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Last Name *</label>
                  <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Marital Status</label>
                  <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Place of Birth</label>
                  <input value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">State of Origin</label>
                  <input value={stateOfOrigin} onChange={(e) => setStateOfOrigin(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">LGA of Origin</label>
                  <input value={lgaOfOrigin} onChange={(e) => setLgaOfOrigin(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone Number</label>
                <input placeholder="e.g. 08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
              </div>
            </div>
          </section>

          {/* Identity */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Identity</h2>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">NIN (National Identity Number)</label>
              <input maxLength={11} placeholder="11 digits" value={nin} onChange={(e) => setNin(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
            </div>
          </section>

          {/* First Appointment */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">First Appointment</h2>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Appointment Date</label>
                  <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Grade Level at Appointment</label>
                  <select value={entryGradeLevel} onChange={(e) => setEntryGradeLevel(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                      <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Step at Appointment</label>
                  <select value={entryStep} onChange={(e) => setEntryStep(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Professional Cadre & Deployment */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Professional Cadre & Deployment</h2>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Professional Cadre</label>
                  <select value={cadreId} onChange={(e) => setCadreId(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">General / None</option>
                    {cadres.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Appointment Type</label>
                  <select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="PERMANENT_PENSIONABLE">Permanent & Pensionable</option>
                    <option value="PROBATION">Probationary</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="SECONDMENT">Secondment</option>
                    <option value="ACTING">Acting Appointment</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Official Post Title</label>
                  <input placeholder="e.g. Head of Unit" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Establishment Post Code</label>
                  <input placeholder="e.g. EST/ADM/001" value={postCode} onChange={(e) => setPostCode(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isConfirmed"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isConfirmed" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Appointment is Confirmed
                </label>
              </div>
            </div>
          </section>

          {/* Confirmation Information */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Confirmation Information</h2>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Confirmation Date</label>
                  <input type="date" value={confirmationDate} onChange={(e) => setConfirmationDate(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Letter Reference Number</label>
                  <input placeholder="e.g. EB/CONF/123" value={confirmationLetterRef} onChange={(e) => setConfirmationLetterRef(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Grade Level at Confirmation</label>
                  <select value={confirmationGradeLevel} onChange={(e) => setConfirmationGradeLevel(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                      <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Step at Confirmation</label>
                  <select value={confirmationStep} onChange={(e) => setConfirmationStep(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Current Post & Salary */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Current Deployment & Final Validation</h2>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Grade Level</label>
                  <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    {Array.from({ length: 17 }, (_, i) => i + 1).map(l => (
                      <option key={l} value={l.toString().padStart(2, '0')}>{l.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Step</label>
                  <select value={step} onChange={(e) => setStep(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="">Select...</option>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Salary Scale</label>
                  <select value={salaryScale} onChange={(e) => setSalaryScale(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                    <option value="CORE">Core Civil Servant (CONPSS)</option>
                    <option value="SUBEB">SUBEB Staff</option>
                    <option value="EXEC_AUDIT">Executive (Audit)</option>
                    <option value="TEACHERS_NP">Teachers (Non-Professional)</option>
                    <option value="TEACHERS_P">Teachers (Professional)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Designation</label>
                  <input placeholder="e.g. Administrative Officer II" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Annual Salary (₦)</label>
                  <div className="relative">
                    <input
                      readOnly
                      placeholder="Select Grade & Step"
                      value={salaryAmount ? formatNaira(salaryAmount) : ""}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-100/50 px-4 py-3 text-sm font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-zinc-400">
                      Auto-Calculated
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ministry / MDA</label>
                  <input placeholder="e.g. Ministry of Education" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                </div>
              </div>
            </div>
          </section>

          {/* Promotion History */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Promotion History ({promotions.length})</h2>
              </div>
              <button
                type="button"
                onClick={handleAddPromotion}
                className="rounded-xl bg-purple-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400"
              >
                + Add Promotion
              </button>
            </div>

            {promotions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-zinc-500">No promotions yet. Click "Add Promotion" to add one.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {promotions.map((promo, index) => (
                  <div key={index} className="relative rounded-2xl border border-zinc-100 bg-zinc-50/30 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <button
                      type="button"
                      onClick={() => handleRemovePromotion(index)}
                      className="absolute right-4 top-4 text-zinc-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Date</label>
                        <input type="date" value={promo.date} onChange={(e) => handlePromotionChange(index, "date", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Grade Level</label>
                        <input type="text" placeholder="GL" value={promo.gradeLevel} onChange={(e) => handlePromotionChange(index, "gradeLevel", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Step</label>
                        <input type="text" placeholder="Step" value={promo.step} onChange={(e) => handlePromotionChange(index, "step", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Designation</label>
                        <input type="text" value={promo.designation} onChange={(e) => handlePromotionChange(index, "designation", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">New Salary (Auto)</label>
                        <input
                          readOnly
                          type="text"
                          placeholder="Select GL & Step"
                          value={promo.salary ? formatNaira(promo.salary) : ""}
                          className="w-full rounded-lg border border-zinc-100 bg-zinc-100/30 px-3 py-2 text-sm font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Education & NYSC */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Education & NYSC</h2>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Highest Qualification</label>
                <select value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50">
                  <option value="">Select...</option>
                  <option value="PHD">PhD</option>
                  <option value="MSC">Master's Degree (M.Sc/M.A)</option>
                  <option value="BSC">First Degree (B.Sc/B.A/HND)</option>
                  <option value="OND">National Diploma (OND/NCE)</option>
                  <option value="SSCE">Secondary School (WASSCE/NECO)</option>
                  <option value="FSLC">Primary School (FSLC)</option>
                </select>
              </div>

              <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Additional Certificates</h3>
                  <button
                    type="button"
                    onClick={handleAddCertificate}
                    className="rounded-lg bg-zinc-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    + Add Certificate
                  </button>
                </div>

                <div className="space-y-4">
                  {certificates.map((cert, index) => (
                    <div key={index} className="relative rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <button
                        type="button"
                        onClick={() => handleRemoveCertificate(index)}
                        className="absolute right-2 top-2 text-zinc-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Cert Type (Degree, HND, etc)</label>
                          <input value={cert.type} onChange={(e) => handleCertificateChange(index, "type", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Institution</label>
                          <input value={cert.institution} onChange={(e) => handleCertificateChange(index, "institution", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Year</label>
                          <input value={cert.year} onChange={(e) => handleCertificateChange(index, "year", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Certificate No.</label>
                          <input value={cert.certificateNumber} onChange={(e) => handleCertificateChange(index, "certificateNumber", e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">NYSC</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Year of Service</label>
                    <input placeholder="e.g. 2015" value={nyscYear} onChange={(e) => setNyscYear(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">State of Service</label>
                    <input value={nyscState} onChange={(e) => setNyscState(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Certificate Number</label>
                    <input value={nyscNumber} onChange={(e) => setNyscNumber(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {message && (
            <div className={`rounded-3xl p-6 shadow-lg ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                <p className="font-bold">{message.text}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href={`/dashboard/states/${stateCode}/workers`}
              className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl bg-zinc-900 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-zinc-800 hover:shadow-2xl active:scale-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading ? "Saving..." : "Save Worker & Check for Issues"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
