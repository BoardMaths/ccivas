"use server";

import { prisma } from "./prisma";
import { auth } from "@/auth";
// @ts-ignore
import { Prisma, DocumentType, CareerActionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createWorkerSchema, updateWorkerSchema, createStateSchema, createDocumentSchema, careerActionSchema } from "./validators";
import { analyzeDocument } from "./analysis";
import { runAuditRules } from "./audit-rules";
import { calculateSalary } from "./salary-utils";
import { getEnhancedSalary } from "./salary-actions";
import { z } from "zod";

/**
 * Require an authenticated session. Call at the top of every server action.
 * Returns the session or throws an object the caller can return directly.
 */
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function getStateByCode(code: string) {
  try {
    await requireAuth();
    const state = await prisma.state.findUnique({
      where: { code }
    });
    return state;
  } catch (error) {
    console.error("Failed to fetch state by code:", error);
    return null;
  }
}

export async function createWorker(data: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  stateId?: string;
  stateCode?: string;
  staffId?: string;
  imageUrl?: string;

  dob?: string;
  gender?: string;
  maritalStatus?: string;
  placeOfBirth?: string;
  stateOfOrigin?: string;
  lgaOfOrigin?: string;
  phone?: string;

  nin?: string;

  dateOfFirstAppointment?: string;
  entryGradeLevel?: string;
  entryStep?: string;
  dateOfPresentAppointment?: string;
  dateOfConfirmation?: string;
  confirmationGradeLevel?: string;
  confirmationStep?: string;
  confirmationLetterRef?: string;
  gradeLevel?: string;
  step?: string;
  designation?: string;
  salaryScale?: string;
  salaryAmount?: string;
  ministry?: string;
  department?: string;

  highestQualification?: string;
  nyscYear?: string;
  nyscState?: string;
  nyscNumber?: string;

  promotions?: Array<{
    date: string;
    gradeLevel: string;
    step?: string;
    designation?: string;
    authorityReference?: string;
    gazetteNumber?: string;
  }>;

  certificates?: Array<{
    type: string;
    institution: string;
    year: string;
    certificateNumber?: string;
  }>;

  // Enhanced CIVAS fields
  cadreId?: string;
  appointmentType?: string;
  isConfirmed?: boolean;
  postTitle?: string;
  postCode?: string;

  nyscStatus?: 'DISCHARGED' | 'EXEMPTED' | 'EXCLUDED' | 'NONE';
  isSuspended?: boolean;
  suspensionDate?: string;
  suspensionReason?: string;
  lastStepIncrementDate?: string;

  // Additional Administrative & Registry
  fileNumber?: string;
  ippisNumber?: string;

  // Financial
  bvn?: string;
  accountNumber?: string;
  bankName?: string;
  pfaName?: string;
  rsaNumber?: string;

  // Medical
  bloodGroup?: string;
  genotype?: string;

  // Next of Kin
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;

  // Address
  residentialAddress?: string;
}) {
  try {
    await requireAuth();
    let { firstName, middleName, lastName } = data;
    const { fullName, stateId, stateCode, staffId, imageUrl } = data;

    // Handle fullName if components are missing
    if (fullName && (!firstName || !lastName)) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = parts[0]; // Fallback if only one name
      } else if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
      } else {
        firstName = parts[0];
        lastName = parts[parts.length - 1];
        middleName = parts.slice(1, -1).join(" ");
      }
    }

    if (!firstName || !lastName) {
      return { success: false, error: "First Name and Last Name are required" };
    }

    // Construct full name for DB if not provided
    const dbFullName = fullName || [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ");

    // Determine target state ID
    let targetStateId = stateId;
    if (!targetStateId && stateCode) {
      const state = await prisma.state.findUnique({
        where: { code: stateCode.toUpperCase() },
        select: { id: true, code: true },
      });
      if (!state) return { success: false, error: "State not found" };
      targetStateId = state.id;
    }

    if (!targetStateId) {
      return { success: false, error: "State ID or Code is required" };
    }

    // Generate staff ID if not provided
    let generatedStaffId = staffId;
    if (!generatedStaffId) {
      const state = await prisma.state.findUnique({
        where: { id: targetStateId },
        select: { code: true },
      });

      if (!state) return { success: false, error: "State not found" };

      // Get the current count
      const workerCount = await prisma.worker.count({
        where: { stateId: targetStateId },
      });

      // Generate ID: Start from 101 for better appearance
      const nextIndex = workerCount + 101;
      generatedStaffId = `${state.code}/${nextIndex}`;
    }

    // 1. Calculate Salary (Prefer DB rules, fallback to hardcoded)
    let calculatedSalary = "0";
    const dbSalary = await getEnhancedSalary({
      stateId: targetStateId,
      cadreId: data.cadreId,
      gradeLevel: data.gradeLevel || "01",
      step: data.step || "01"
    });

    if (dbSalary) {
      calculatedSalary = (dbSalary as any).basicSalary.toString();
    } else {
      calculatedSalary = calculateSalary(data.gradeLevel, data.step, data.salaryScale || "CORE").toString();
    }

    // Fetch enhanced rules if cadre/state provided
    let retirementAge: number | undefined;
    let maxServiceYears: number | undefined;
    let promotionIntervalRules: Record<string, number> | undefined;
    let requiresNYSC: boolean | undefined;
    let entryRequirements: Record<string, any> | undefined;
    let minGradeLevel: string | undefined;
    let maxGradeLevel: string | undefined;

    if (targetStateId) {
      const retirementRule = await prisma.stateRetirementRule.findFirst({
        where: {
          stateId: targetStateId,
          OR: [
            { cadreId: data.cadreId || null },
            { cadreId: null }
          ]
        },
        orderBy: [
          { cadreId: 'desc' }, // Rules with cadreId (specific) before null (default)
          { effectiveDate: 'desc' }
        ]
      });

      retirementAge = retirementRule?.retirementAge;
      maxServiceYears = retirementRule?.maxServiceYears;

      if (data.cadreId) {
        const cadre = await (prisma as any).cadre.findUnique({
          where: { id: data.cadreId }
        });
        if (cadre) {
          promotionIntervalRules = cadre.promotionIntervals as Record<string, number>;
          requiresNYSC = cadre.requiresNYSC;
          entryRequirements = cadre.entryRequirements as Record<string, any>;
          minGradeLevel = cadre.minGradeLevel;
          maxGradeLevel = cadre.maxGradeLevel;
          (data as any).requiresProfessionalCert = cadre.requiresProfessionalCert;
        }
      }
    }

    // Run Audit Rules for Nigeria Civil Service
    const auditRes = runAuditRules({
      dob: data.dob,
      dateOfFirstAppointment: data.dateOfFirstAppointment,
      entryGradeLevel: data.entryGradeLevel,
      entryStep: data.entryStep,
      dateOfPresentAppointment: data.dateOfPresentAppointment,
      dateOfConfirmation: data.dateOfConfirmation,
      confirmationGradeLevel: data.confirmationGradeLevel,
      confirmationStep: data.confirmationStep,
      confirmationLetterRef: data.confirmationLetterRef,
      gradeLevel: data.gradeLevel,
      step: data.step,
      designation: data.designation,
      salaryScale: data.salaryScale,
      salaryAmount: calculatedSalary,
      ministry: data.ministry,
      department: data.department,
      highestQualification: data.highestQualification,
      nyscYear: data.nyscYear,
      nyscStatus: data.nyscStatus,
      isSuspended: data.isSuspended,
      promotions: data.promotions,
      certificates: data.certificates,

      // Pass new fields to audit engine
      stateId: targetStateId,
      cadreId: data.cadreId,
      isConfirmed: data.isConfirmed,
      appointmentType: data.appointmentType,
      retirementAge,
      maxServiceYears,
      promotionIntervalRules,
      requiresNYSC,
      entryRequirements,
      minGradeLevel,
      maxGradeLevel,
      leaveRecords: [],
      requiresProfessionalCert: (data as any).requiresProfessionalCert || false
    });

    const isFlagged = auditRes.isFlagged;
    const flagReason = auditRes.flagReason.join(" | ");
    const flagSeverity = auditRes.severity;

    // Helper for safe date parsing
    const parseSafeDate = (dateStr?: string | null) => {
      if (!dateStr || (typeof dateStr === 'string' && dateStr.trim() === "")) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    // Helper to convert empty strings to null for optional database fields
    const nullify = (val?: string | null) => {
      if (!val || (typeof val === 'string' && val.trim() === "")) return null;
      return val;
    };

    // Create the worker
    const worker = await prisma.worker.create({
      data: {
        firstName,
        lastName,
        middleName,
        fullName: dbFullName,
        staffId: generatedStaffId,
        stateId: targetStateId,
        imageUrl: imageUrl,

        dob: parseSafeDate(data.dob),
        gender: nullify(data.gender),
        maritalStatus: nullify(data.maritalStatus),
        placeOfBirth: nullify(data.placeOfBirth),
        stateOfOrigin: nullify(data.stateOfOrigin),
        lgaOfOrigin: nullify(data.lgaOfOrigin),
        phone: nullify(data.phone),

        nin: nullify(data.nin),

        gradeLevel: nullify(data.gradeLevel),
        step: nullify(data.step),
        dateOfFirstAppointment: parseSafeDate(data.dateOfFirstAppointment),
        entryGradeLevel: nullify(data.entryGradeLevel),
        entryStep: nullify(data.entryStep),
        dateOfPresentAppointment: parseSafeDate(data.dateOfPresentAppointment),
        dateOfConfirmation: parseSafeDate(data.dateOfConfirmation),
        confirmationGradeLevel: nullify(data.confirmationGradeLevel),
        confirmationStep: nullify(data.confirmationStep),
        confirmationLetterRef: nullify(data.confirmationLetterRef),
        designation: nullify(data.designation),
        salaryScale: data.salaryScale || "CORE",
        salaryAmount: calculatedSalary,
        ministry: nullify(data.ministry),
        department: nullify(data.department),

        highestQualification: nullify(data.highestQualification),
        nyscStatus: data.nyscStatus || 'NONE',
        nyscYear: nullify(data.nyscYear),
        nyscState: nullify(data.nyscState),
        nyscNumber: nullify(data.nyscNumber),

        isSuspended: data.isSuspended || false,
        suspensionDate: parseSafeDate(data.suspensionDate),
        suspensionReason: nullify(data.suspensionReason),
        lastStepIncrementDate: parseSafeDate(data.lastStepIncrementDate),

        // Registry & Administrative
        fileNumber: nullify(data.fileNumber),
        ippisNumber: nullify(data.ippisNumber),

        // Financial
        bvn: nullify(data.bvn),
        accountNumber: nullify(data.accountNumber),
        bankName: nullify(data.bankName),
        pfaName: nullify(data.pfaName),
        rsaNumber: nullify(data.rsaNumber),

        // Medical
        bloodGroup: nullify(data.bloodGroup),
        genotype: nullify(data.genotype),

        // Next of Kin
        nextOfKinName: nullify(data.nextOfKinName),
        nextOfKinPhone: nullify(data.nextOfKinPhone),
        nextOfKinRelationship: nullify(data.nextOfKinRelationship),

        // Address
        residentialAddress: nullify(data.residentialAddress),

        // Enhanced Fields
        cadreId: data.cadreId,
        appointmentType: (data.appointmentType as any) || "TEMPORARY",
        isConfirmed: data.isConfirmed || false,
        postTitle: nullify(data.postTitle),
        postCode: nullify(data.postCode),

        isFlagged,
        flagReason,
        flagSeverity,

        promotions: data.promotions ? {
          create: data.promotions.map(p => ({
            date: parseSafeDate(p.date) || new Date(), // Default to now if somehow empty
            gradeLevel: p.gradeLevel,
            step: p.step,
            designation: p.designation,
            authorityReference: p.authorityReference,
            gazetteNumber: p.gazetteNumber,
            salary: calculateSalary(p.gradeLevel, p.step, data.salaryScale || "CORE").toString()
          }))
        } : undefined,

        certificates: data.certificates ? {
          create: data.certificates.map(c => ({
            type: c.type,
            institution: c.institution,
            year: c.year,
            certificateNumber: c.certificateNumber
          }))
        } : undefined
      },
    });

    revalidatePath("/dashboard/workers");
    if (stateCode) revalidatePath(`/dashboard/states/${stateCode}`);
    if (stateId) revalidatePath(`/dashboard/states/${stateId}`);
    return { success: true, worker: JSON.parse(JSON.stringify(worker)) };
  } catch (error) {
    console.error("[createWorker] Detailed Error:", error);
    if (error instanceof Error) {
      console.error("[createWorker] Message:", error.message);
      console.error("[createWorker] Stack:", error.stack);
    }
    return { success: false, error: error instanceof Error ? error.message : "Failed to create worker" };
  }
}

export async function updateWorker(id: string, data: any) {
  try {
    await requireAuth();
    // Fetch existing worker with promotions and certificates for audit
    const existingWorker = await prisma.worker.findUnique({
      where: { id },
      include: {
        promotions: { orderBy: { date: 'asc' } },
        certificates: { orderBy: { year: 'asc' } },
        careerActions: { orderBy: { effectiveDate: 'asc' } },
        leaveRecords: { where: { status: 'APPROVED' }, orderBy: { startDate: 'desc' } },
        cadre: true
      }
    });

    if (!existingWorker) {
      return { success: false, error: "Worker not found" };
    }

    const targetStateId = (data.stateId || (existingWorker as any).stateId) as string;
    const targetCadreId = (data.cadreId || (existingWorker as any).cadreId) as string | undefined;

    // Construct full name if components provided
    let dbFullName = data.fullName;
    if (!dbFullName && (data.firstName || data.lastName)) {
      dbFullName = [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ");
    }


    // 1. Calculate Salary (Prefer DB rules, fallback to hardcoded)
    let calculatedSalary = "0";
    const dbSalary = await getEnhancedSalary({
      stateId: targetStateId,
      cadreId: targetCadreId,
      gradeLevel: data.gradeLevel || existingWorker.gradeLevel || "01",
      step: data.step || existingWorker.step || "01"
    });

    if (dbSalary) {
      calculatedSalary = (dbSalary as any).basicSalary.toString();
    } else {
      calculatedSalary = calculateSalary(
        data.gradeLevel || existingWorker.gradeLevel,
        data.step || existingWorker.step,
        data.salaryScale || existingWorker.salaryScale || "CORE"
      ).toString();
    }

    // Fetch enhanced rules if cadre/state provided
    let retirementAge: number | undefined;
    let maxServiceYears: number | undefined;
    let promotionIntervalRules: Record<string, number> | undefined;
    let requiresNYSC: boolean | undefined;
    let entryRequirements: Record<string, any> | undefined;
    let minGradeLevel: string | undefined;
    let maxGradeLevel: string | undefined;

    if (targetStateId) {
      const retirementRule = await prisma.stateRetirementRule.findFirst({
        where: {
          stateId: targetStateId,
          OR: [
            { cadreId: targetCadreId || null },
            { cadreId: null }
          ]
        },
        orderBy: [
          { cadreId: 'desc' },
          { effectiveDate: 'desc' }
        ]
      });

      retirementAge = retirementRule?.retirementAge;
      maxServiceYears = retirementRule?.maxServiceYears;

      if (targetCadreId) {
        const cadre = await (prisma as any).cadre.findUnique({
          where: { id: targetCadreId }
        });
        if (cadre) {
          promotionIntervalRules = cadre.promotionIntervals as Record<string, number>;
          requiresNYSC = cadre.requiresNYSC;
          entryRequirements = cadre.entryRequirements as Record<string, any>;
          minGradeLevel = cadre.minGradeLevel;
          maxGradeLevel = cadre.maxGradeLevel;
        }
      }
    }

    // Run Audit Rules with existing promotions and certificates
    const auditRes = runAuditRules({
      dob: data.dob,
      dateOfFirstAppointment: data.dateOfFirstAppointment,
      entryGradeLevel: data.entryGradeLevel,
      entryStep: data.entryStep,
      dateOfPresentAppointment: data.dateOfPresentAppointment,
      dateOfConfirmation: data.dateOfConfirmation,
      confirmationGradeLevel: data.confirmationGradeLevel,
      confirmationStep: data.confirmationStep,
      confirmationLetterRef: data.confirmationLetterRef,
      gradeLevel: data.gradeLevel,
      step: data.step,
      designation: data.designation,
      salaryScale: data.salaryScale,
      salaryAmount: calculatedSalary,
      ministry: data.ministry,
      department: data.department,
      highestQualification: data.highestQualification,
      nyscYear: data.nyscYear,
      nyscStatus: data.nyscStatus || (existingWorker as any).nyscStatus,
      isSuspended: data.isSuspended !== undefined ? data.isSuspended : (existingWorker as any).isSuspended,
      promotions: data.promotions || existingWorker.promotions,
      careerActions: (existingWorker as any).careerActions,
      certificates: data.certificates || existingWorker.certificates,

      // Pass new fields to audit engine
      stateId: targetStateId,
      cadreId: targetCadreId,
      isConfirmed: data.isConfirmed !== undefined ? data.isConfirmed : existingWorker.isConfirmed,
      appointmentType: data.appointmentType || existingWorker.appointmentType,
      retirementAge,
      maxServiceYears,
      promotionIntervalRules,
      requiresNYSC,
      entryRequirements,
      minGradeLevel,
      maxGradeLevel,
      leaveRecords: (existingWorker as any).leaveRecords || [],
      requiresProfessionalCert: (existingWorker as any).cadre?.requiresProfessionalCert || (data as any).requiresProfessionalCert || false
    });

    const isFlagged = auditRes.isFlagged;
    const flagReason = auditRes.flagReason.join(" | ");
    const flagSeverity = auditRes.severity;

    const parseSafeDate = (dateStr?: string | null) => {
      if (!dateStr || (typeof dateStr === 'string' && dateStr.trim() === "")) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const nullify = (val?: string | null) => {
      if (!val || (typeof val === 'string' && val.trim() === "")) return null;
      return val;
    };

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        fullName: dbFullName,
        imageUrl: data.imageUrl,

        dob: parseSafeDate(data.dob),
        gender: nullify(data.gender),
        maritalStatus: nullify(data.maritalStatus),
        placeOfBirth: nullify(data.placeOfBirth),
        stateOfOrigin: nullify(data.stateOfOrigin),
        lgaOfOrigin: nullify(data.lgaOfOrigin),
        phone: nullify(data.phone),

        nin: nullify(data.nin),

        gradeLevel: nullify(data.gradeLevel),
        step: nullify(data.step),
        dateOfFirstAppointment: parseSafeDate(data.dateOfFirstAppointment),
        entryGradeLevel: nullify(data.entryGradeLevel),
        entryStep: nullify(data.entryStep),
        dateOfPresentAppointment: parseSafeDate(data.dateOfPresentAppointment),
        dateOfConfirmation: parseSafeDate(data.dateOfConfirmation),
        confirmationGradeLevel: nullify(data.confirmationGradeLevel),
        confirmationStep: nullify(data.confirmationStep),
        confirmationLetterRef: nullify(data.confirmationLetterRef),
        designation: nullify(data.designation),
        salaryScale: nullify(data.salaryScale),
        salaryAmount: calculatedSalary,
        ministry: nullify(data.ministry),
        department: nullify(data.department),

        highestQualification: nullify(data.highestQualification),
        nyscStatus: data.nyscStatus,
        nyscYear: nullify(data.nyscYear),
        nyscState: nullify(data.nyscState),
        nyscNumber: nullify(data.nyscNumber),

        isSuspended: data.isSuspended,
        suspensionDate: parseSafeDate(data.suspensionDate),
        suspensionReason: nullify(data.suspensionReason),
        lastStepIncrementDate: parseSafeDate(data.lastStepIncrementDate),

        // Registry & Administrative
        fileNumber: nullify(data.fileNumber),
        ippisNumber: nullify(data.ippisNumber),

        // Financial
        bvn: nullify(data.bvn),
        accountNumber: nullify(data.accountNumber),
        bankName: nullify(data.bankName),
        pfaName: nullify(data.pfaName),
        rsaNumber: nullify(data.rsaNumber),

        // Medical
        bloodGroup: nullify(data.bloodGroup),
        genotype: nullify(data.genotype),

        // Next of Kin
        nextOfKinName: nullify(data.nextOfKinName),
        nextOfKinPhone: nullify(data.nextOfKinPhone),
        nextOfKinRelationship: nullify(data.nextOfKinRelationship),

        // Address
        residentialAddress: nullify(data.residentialAddress),

        // Enhanced Fields
        cadreId: data.cadreId,
        appointmentType: data.appointmentType,
        isConfirmed: data.isConfirmed,
        postTitle: nullify(data.postTitle),
        postCode: nullify(data.postCode),

        isFlagged,
        flagReason,
        flagSeverity,

        promotions: data.promotions ? {
          deleteMany: {},
          create: data.promotions.map((p: any) => ({
            date: parseSafeDate(p.date) || new Date(),
            gradeLevel: p.gradeLevel,
            step: p.step,
            designation: p.designation,
            authorityReference: p.authorityReference,
            gazetteNumber: p.gazetteNumber,
            salary: calculateSalary(p.gradeLevel, p.step, data.salaryScale || existingWorker.salaryScale || "CORE").toString()
          }))
        } : undefined,

        certificates: data.certificates ? {
          deleteMany: {},
          create: data.certificates.map((c: any) => ({
            type: c.type,
            institution: c.institution,
            year: c.year,
            certificateNumber: c.certificateNumber
          }))
        } : undefined,
      },
    });

    revalidatePath("/dashboard/workers");
    revalidatePath(`/dashboard/states/${worker.stateId}`);
    revalidatePath(`/dashboard/states/${worker.stateId}/workers/${id}`);

    return { success: true, worker: JSON.parse(JSON.stringify(worker)) };
  } catch (error) {
    console.error("[updateWorker] Error:", error);
    return { success: false, error: "Failed to update worker" };
  }
}

export async function deleteWorker(id: string) {
  try {
    await requireAuth();
    const worker = await prisma.worker.delete({
      where: { id },
    });

    revalidatePath("/dashboard/workers");
    revalidatePath(`/dashboard/states/${worker.stateId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete worker:", error);
    return { success: false, error: "Failed to delete worker" };
  }
}

// Project and Document actions removed as per requirement

export async function createState(data: { name: string; code: string }) {
  try { await requireAuth(); } catch { return { success: false, error: "Unauthorized" }; }
  const validationResult = createStateSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.issues[0].message };
  }

  try {
    const state = await prisma.state.create({
      data: {
        name: data.name,
        code: data.code,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/states");
    return { success: true, state: JSON.parse(JSON.stringify(state)) };
  } catch (error) {
    console.error("Failed to create state:", error);
    return { success: false, error: "Failed to create state" };
  }
}

export async function createCareerAction(data: z.infer<typeof careerActionSchema>) {
  try {
    await requireAuth();
    const validation = careerActionSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const worker = await prisma.worker.findUnique({
      where: { id: data.workerId },
      include: {
        promotions: { orderBy: { date: 'asc' } },
        certificates: { orderBy: { year: 'asc' } },
        careerActions: { orderBy: { effectiveDate: 'asc' } }
      }
    });

    if (!worker) return { success: false, error: "Worker not found" };

    // 1. Record the action
    const action = await prisma.careerAction.create({
      data: {
        workerId: data.workerId,
        type: data.type as any,
        effectiveDate: new Date(data.effectiveDate),
        fromGradeLevel: worker.gradeLevel,
        fromStep: worker.step,
        fromDesignation: worker.designation,
        fromSalary: worker.salaryAmount ? parseFloat(worker.salaryAmount) : 0,
        toGradeLevel: data.toGradeLevel,
        toStep: data.toStep,
        toDesignation: data.toDesignation,
        toSalary: data.toSalary ? parseFloat(data.toSalary) : 0,
        authorityReference: data.authorityReference,
        gazetteNumber: data.gazetteNumber,
        remarks: data.remarks
      }
    });

    // 2. Update Worker Current Status
    // If it's a confirmation, update the confirmation fields too
    const updateData: any = {
      gradeLevel: data.toGradeLevel,
      step: data.toStep,
      dateOfPresentAppointment: new Date(data.effectiveDate),
      designation: data.toDesignation || worker.designation,
      salaryAmount: data.toSalary || worker.salaryAmount,
    };

    if (data.type === 'CONFIRMATION') {
      updateData.isConfirmed = true;
      updateData.dateOfConfirmation = new Date(data.effectiveDate);
      updateData.confirmationGradeLevel = data.toGradeLevel;
      updateData.confirmationStep = data.toStep;
      updateData.confirmationLetterRef = data.authorityReference;
    }

    // 3. Re-run Audit with new state
    const auditRes = runAuditRules({
      dob: worker.dob,
      dateOfFirstAppointment: worker.dateOfFirstAppointment,
      dateOfPresentAppointment: new Date(data.effectiveDate),
      dateOfConfirmation: updateData.dateOfConfirmation || worker.dateOfConfirmation,
      gradeLevel: data.toGradeLevel,
      step: data.toStep,
      designation: data.toDesignation || worker.designation,
      salaryAmount: data.toSalary || worker.salaryAmount,
      highestQualification: worker.highestQualification,
      nyscStatus: worker.nyscStatus as any,
      isSuspended: worker.isSuspended,
      promotions: worker.promotions,
      certificates: worker.certificates,
      stateId: worker.stateId,
      cadreId: worker.cadreId,
      isConfirmed: updateData.isConfirmed || worker.isConfirmed,
      appointmentType: worker.appointmentType
    });

    // 4. Final Save to Worker
    await prisma.worker.update({
      where: { id: data.workerId },
      data: {
        ...updateData,
        isFlagged: auditRes.isFlagged,
        flagReason: auditRes.flagReason.join(" | ")
      }
    });

    revalidatePath(`/dashboard/states/${worker.stateId}/workers/${worker.id}`);
    revalidatePath("/dashboard/workers");

    return { success: true, action: JSON.parse(JSON.stringify(action)) };
  } catch (error) {
    console.error("[createCareerAction] Error:", error);
    return { success: false, error: "Failed to record career action" };
  }
}

export async function deleteState(id: string) {
  try {
    await requireAuth();
    await prisma.state.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/states");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete state:", error);
    return { success: false, error: "Failed to delete state" };
  }
}

const NIGERIAN_STATES = [
  { name: "Abia", code: "AB" },
  { name: "Adamawa", code: "AD" },
  { name: "Akwa Ibom", code: "AK" },
  { name: "Anambra", code: "AN" },
  { name: "Bauchi", code: "BA" },
  { name: "Bayelsa", code: "BY" },
  { name: "Benue", code: "BN" },
  { name: "Borno", code: "BO" },
  { name: "Cross River", code: "CR" },
  { name: "Delta", code: "DT" },
  { name: "Ebonyi", code: "EB" },
  { name: "Edo", code: "ED" },
  { name: "Ekiti", code: "EK" },
  { name: "Enugu", code: "EN" },
  { name: "FCT", code: "FC" },
  { name: "Gombe", code: "GB" },
  { name: "Imo", code: "IM" },
  { name: "Jigawa", code: "JG" },
  { name: "Kaduna", code: "KD" },
  { name: "Kano", code: "KN" },
  { name: "Katsina", code: "KT" },
  { name: "Kebbi", code: "KB" },
  { name: "Kogi", code: "KG" },
  { name: "Kwara", code: "KW" },
  { name: "Lagos", code: "LA" },
  { name: "Nasarawa", code: "NA" },
  { name: "Niger", code: "NG" },
  { name: "Ogun", code: "OG" },
  { name: "Ondo", code: "ON" },
  { name: "Osun", code: "OS" },
  { name: "Oyo", code: "OY" },
  { name: "Plateau", code: "PL" },
  { name: "Rivers", code: "RV" },
  { name: "Sokoto", code: "SK" },
  { name: "Taraba", code: "TR" },
  { name: "Yobe", code: "YB" },
  { name: "Zamfara", code: "ZM" },
];

export async function bulkLoadStates() {
  try {
    await requireAuth();
    for (const s of NIGERIAN_STATES) {
      await prisma.state.upsert({
        where: { name: s.name },
        update: { code: s.code },
        create: { name: s.name, code: s.code },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/states");
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk load states:", error);
    return { success: false, error: "Failed to bulk load states" };
  }
}

export async function createWorkerDocument(data: {
  workerId: string;
  type: DocumentType;
  url: string;
  // Auth is checked inside the function
  name?: string;
}) {
  const validationResult = createDocumentSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.issues[0].message };
  }

  try {
    await requireAuth();
    // 2. Create the document record with metadata
    // Note: We skip AI analysis here for "instant" upload experience.
    // Analysis will happen when the user clicks "Review".
    const document = await prisma.document.create({
      data: {
        workerId: data.workerId,
        type: data.type,
        url: data.url,
        name: data.name,
        // extractedName: analysis.extractedName,
        // extractedDate: analysis.extractedDate ? new Date(analysis.extractedDate) : undefined,
        // confidence: analysis.confidence,
        // warnings: analysis.warnings as any,
        // extractedData: analysis.extractedData as any,
        isVerified: false,
      },
    });

    // 3. Auto-update worker DOB skip (moved to review step)

    const worker = await prisma.worker.findUnique({
      where: { id: data.workerId },
      select: { stateId: true, state: { select: { code: true } } },
    });

    if (worker) {
      revalidatePath(`/dashboard/states/${worker.state.code}/workers/${data.workerId}/documents`);
      revalidatePath(`/dashboard/states/${worker.state.code}/workers`);
    }

    return { success: true, document: JSON.parse(JSON.stringify(document)) };
  } catch (error) {
    console.error("Failed to create document:", error);
    return { success: false, error: `Failed to create document: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

// New action: Analyze document without saving (for review step)
export async function analyzeDocumentOnly(data: {
  url: string;
  type: DocumentType;
}) {
  try {
    await requireAuth();
    console.log("[analyzeDocumentOnly] Starting AI Analysis...");
    const analysis = await analyzeDocument(data.url, data.type);
    console.log("[analyzeDocumentOnly] Analysis completed:", analysis);

    return JSON.parse(JSON.stringify({
      success: true,
      data: analysis
    }));
  } catch (error) {
    console.error("Failed to analyze document:", error);
    return {
      success: false,
      error: "Failed to analyze document",
      data: {
        confidence: 0,
        warnings: ["AI analysis failed. Please enter data manually."]
      }
    };
  }
}

// New action: Save document with user-verified data (Create new)
export async function saveDocumentWithData(data: {
  workerId: string;
  type: DocumentType;
  url: string;
  name: string;
  extractedName?: string;
  extractedDate?: string;
  nin?: string;
  rank?: string;
  salary?: string;
  confidence: number;
  warnings: string[];
  rawText?: string;
}) {
  try {
    const extraData: Record<string, string> = {};
    if (data.nin) extraData.nin = data.nin;
    if (data.rank) extraData.rank = data.rank;
    if (data.salary) extraData.salary = data.salary;

    const document = await prisma.document.create({
      data: {
        workerId: data.workerId,
        type: data.type,
        url: data.url,
        name: data.name,
        extractedName: data.extractedName,
        extractedDate: data.extractedDate ? new Date(data.extractedDate) : undefined,
        confidence: data.confidence,
        warnings: data.warnings as any,
        extractedData: Object.keys(extraData).length > 0 ? extraData : undefined,
        isVerified: true, // Mark as verified immediately
      },
    });

    // Auto-update worker DOB if it's a Birth Certificate
    if (document.type === "BIRTH_CERTIFICATE_AGE_DECLARATION" && data.extractedDate) {
      await prisma.worker.update({
        where: { id: data.workerId },
        data: { dob: new Date(data.extractedDate) }
      });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: data.workerId },
      select: { stateId: true, state: { select: { code: true } } },
    });

    if (worker) {
      revalidatePath(`/dashboard/states/${worker.state.code}/workers/${data.workerId}/documents`);
      revalidatePath(`/dashboard/states/${worker.state.code}/workers`);
    }

    return { success: true, document: JSON.parse(JSON.stringify(document)) };
  } catch (error) {
    console.error("Failed to save document:", error);
    return { success: false, error: "Failed to save document" };
  }
}

// New action: Save document with user-verified data
export async function updateDocumentWithData(data: {
  documentId: string;
  workerId: string;
  name: string;
  extractedName?: string;
  extractedDate?: string;
  nin?: string;
  rank?: string;
  salary?: string;
  confidence: number;
  warnings: string[];
  rawText?: string;
}) {
  try {
    const extraData: Record<string, string> = {};
    if (data.nin) extraData.nin = data.nin;
    if (data.rank) extraData.rank = data.rank;
    if (data.salary) extraData.salary = data.salary;

    const document = await prisma.document.update({
      where: { id: data.documentId },
      data: {
        name: data.name,
        extractedName: data.extractedName,
        extractedDate: data.extractedDate ? new Date(data.extractedDate) : undefined,
        confidence: data.confidence,
        warnings: data.warnings as any,
        extractedData: Object.keys(extraData).length > 0 ? extraData : undefined,
        isVerified: true, // Mark as verified
      },
    });

    // Auto-update worker DOB if it's a Birth Certificate
    if (document.type === "BIRTH_CERTIFICATE_AGE_DECLARATION" && data.extractedDate) {
      await prisma.worker.update({
        where: { id: data.workerId },
        data: { dob: new Date(data.extractedDate) }
      });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: data.workerId },
      select: { stateId: true, state: { select: { code: true } } },
    });

    if (worker) {
      revalidatePath(`/dashboard/states/${worker.state.code}/workers/${data.workerId}/documents`);
    }

    return { success: true, document: JSON.parse(JSON.stringify(document)) };
  } catch (error) {
    console.error("Failed to update document:", error);
    return { success: false, error: "Failed to update document" };
  }
}

export async function getNextUnverifiedDocument(workerId: string) {
  try {
    const document = await prisma.document.findFirst({
      where: {
        workerId,
        isVerified: false,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (document) {
      // Check if analysis has run (check if extractedName or confidence is set)
      // If not, run it now (Lazy Extraction)
      if (document.extractedName === null && document.confidence === null) {
        try {
          console.log("[getNextUnverifiedDocument] Performing lazy analysis for:", document.id);
          const analysis = await analyzeDocument(document.url, document.type);

          const updatedDoc = await prisma.document.update({
            where: { id: document.id },
            data: {
              extractedName: analysis.extractedName,
              extractedDate: analysis.extractedDate ? new Date(analysis.extractedDate) : undefined,
              confidence: analysis.confidence,
              warnings: analysis.warnings as any,
              extractedData: analysis.extractedData as any,
            }
          });
          return { success: true, document: JSON.parse(JSON.stringify(updatedDoc)) };
        } catch (analysisError) {
          console.error("[getNextUnverifiedDocument] Analysis failed, returning document for manual review:", analysisError);
          // Return original document so user can manually edit
          return { success: true, document: JSON.parse(JSON.stringify(document)) };
        }
      }
    }

    return { success: true, document: JSON.parse(JSON.stringify(document)) };
  } catch (error) {
    console.error("Failed to get next unverified document:", error);
    return { success: false, error: "Failed to fetch document" };
  }
}

export async function getDocumentForReview(documentId: string) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) return { success: false, error: "Document not found" };

    // Lazy Extraction
    if (document.extractedName === null && document.confidence === null) {
      try {
        console.log("[getDocumentForReview] Performing lazy analysis for:", document.id);
        const analysis = await analyzeDocument(document.url, document.type);

        const updatedDoc = await prisma.document.update({
          where: { id: document.id },
          data: {
            extractedName: analysis.extractedName,
            extractedDate: analysis.extractedDate ? new Date(analysis.extractedDate) : undefined,
            confidence: analysis.confidence,
            warnings: analysis.warnings as any,
            extractedData: analysis.extractedData as any,
          }
        });
        return { success: true, document: JSON.parse(JSON.stringify(updatedDoc)) };
      } catch (analysisError) {
        console.error("[getDocumentForReview] Analysis failed, returning document for manual review:", analysisError);
        return { success: true, document: JSON.parse(JSON.stringify(document)) };
      }
    }

    return { success: true, document: JSON.parse(JSON.stringify(document)) };
  } catch (error) {
    console.error("Failed to get document for review:", error);
    return { success: false, error: "Failed to get document" };
  }
}

export async function deleteDocument(documentId: string, workerId: string) {
  try {
    const document = await prisma.document.delete({
      where: { id: documentId },
    });

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { stateId: true, state: { select: { code: true } } },
    });

    if (worker) {
      revalidatePath(`/dashboard/states/${worker.state.code}/workers/${workerId}/documents`);
      // Maybe revalidate the worker page too if it shows document count?
      revalidatePath(`/dashboard/states/${worker.state.code}/workers`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

export async function getWorkerAuditData(workerId: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        documents: {
          orderBy: { createdAt: "asc" }
        },
        promotions: {
          orderBy: { date: "desc" }
        },
        certificates: {
          orderBy: { year: "desc" }
        },
        leaveRecords: {
          where: { status: "APPROVED" },
          orderBy: { startDate: "desc" }
        },
        careerActions: {
          orderBy: { effectiveDate: "desc" }
        },
        cadre: true
      }
    });

    if (!worker) return { success: false, error: "Worker not found" };

    // Run analysis on all unverified documents that haven't been analyzed yet
    const analyzedDocuments = await Promise.all(
      worker.documents.map(async (doc: any) => {
        if (doc.extractedName === null && doc.confidence === null) {
          try {
            console.log(`[getWorkerAuditData] Analyzing doc: ${doc.id}`);
            const analysis = await analyzeDocument(doc.url, doc.type);
            return await prisma.document.update({
              where: { id: doc.id },
              data: {
                extractedName: analysis.extractedName,
                extractedDate: analysis.extractedDate ? new Date(analysis.extractedDate) : undefined,
                confidence: analysis.confidence,
                warnings: analysis.warnings as any,
                extractedData: analysis.extractedData as any,
              }
            });
          } catch (e) {
            console.error(`[getWorkerAuditData] Analysis failed for ${doc.id}:`, e);
            return doc;
          }
        }
        return doc;
      })
    );

    const cadres = await prisma.cadre.findMany({
      where: { stateId: worker.stateId },
      orderBy: { name: 'asc' }
    });

    return JSON.parse(JSON.stringify({
      success: true,
      worker: {
        ...worker,
        documents: analyzedDocuments
      },
      cadres
    }));
  } catch (error) {
    console.error("Failed to get audit data:", error);
    return { success: false, error: "Failed to fetch audit data" };
  }
}

export async function auditWorkerProfile(workerId: string, data: {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dob?: string;
  gender?: string;
  placeOfBirth?: string;
  stateOfOrigin?: string;
  nin?: string;
  appointmentDate?: string;
  rank: string;
  designation: string;
  salaryScale: string;
  salaryAmount: string;
  ministry?: string;
  department?: string;
  highestQualification?: string;
  nyscYear?: string;
  nyscState?: string;
  nyscNumber?: string;
  promotions: Array<{
    date: string;
    gradeLevel: string;
    designation: string;
    salary: string;
  }>;
  certificates: Array<{
    type: string;
    institution: string;
    year: string;
    certificateNumber?: string;
  }>;
  step?: string;
  verifiedDocumentIds: string[];

  // Enhanced Fields
  cadreId?: string;
  appointmentType?: string;
  isConfirmed?: boolean;
  postTitle?: string;
  postCode?: string;
}): Promise<{ success: true; worker: any; error?: never } | { success: false; error: string; worker?: never }> {
  try {
    await requireAuth();
    return await prisma.$transaction(async (tx: any) => {
      // 1. Update Worker Profile
      const updatedWorker = await tx.worker.update({
        where: { id: workerId },
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          fullName: data.fullName,
          dob: data.dob ? new Date(data.dob) : null,
          gender: data.gender,
          placeOfBirth: data.placeOfBirth,
          stateOfOrigin: data.stateOfOrigin,
          nin: data.nin,
          appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : null,
          rank: data.rank,
          gradeLevel: data.rank,
          step: data.step,
          designation: data.designation,
          salaryScale: data.salaryScale,
          salaryAmount: data.salaryAmount,
          ministry: data.ministry,
          department: data.department,
          nyscYear: data.nyscYear,
          nyscStatus: (data as any).nyscStatus || 'NONE',
          nyscState: data.nyscState,
          nyscNumber: data.nyscNumber,
          isVerified: true,

          // Enhanced Fields
          cadreId: data.cadreId,
          appointmentType: (data.appointmentType as any),
          isConfirmed: data.isConfirmed,
          postTitle: data.postTitle,
          postCode: data.postCode,
        },
        include: { state: true, cadre: true }
      });

      // 2. Sync Promotions (Clean then insert for the audit)
      await tx.promotion.deleteMany({ where: { workerId } });
      if (data.promotions.length > 0) {
        await tx.promotion.createMany({
          data: data.promotions.map(p => ({
            workerId,
            date: new Date(p.date),
            gradeLevel: p.gradeLevel,
            designation: p.designation,
            salary: p.salary,
          }))
        });
      }

      // 3. Sync Certificates
      await tx.academicCertificate.deleteMany({ where: { workerId } });
      if (data.certificates.length > 0) {
        await tx.academicCertificate.createMany({
          data: data.certificates.map(c => ({
            workerId,
            type: c.type,
            institution: c.institution,
            year: c.year,
            certificateNumber: c.certificateNumber,
          }))
        });
      }

      // 4. Mark documents as verified
      await tx.document.updateMany({
        where: {
          id: { in: data.verifiedDocumentIds },
          workerId: workerId
        },
        data: { isVerified: true }
      });

      // 5. Final Audit Execution
      // Fetch everything we just updated + existing leaveRecords/careerActions
      const fullWorker = await tx.worker.findUnique({
        where: { id: workerId },
        include: {
          promotions: { orderBy: { date: 'asc' } },
          certificates: { orderBy: { year: 'asc' } },
          leaveRecords: { where: { status: 'APPROVED' }, orderBy: { startDate: 'desc' } },
          careerActions: { orderBy: { effectiveDate: 'asc' } },
          cadre: true
        }
      });

      if (fullWorker) {
        // Fetch state-specific rules
        const retirementRule = await tx.stateRetirementRule.findFirst({
          where: {
            stateId: fullWorker.stateId,
            OR: [
              { cadreId: fullWorker.cadreId || null },
              { cadreId: null }
            ]
          },
          orderBy: [
            { cadreId: 'desc' },
            { effectiveDate: 'desc' }
          ]
        });

        const auditRes = runAuditRules({
          dob: fullWorker.dob,
          dateOfFirstAppointment: fullWorker.dateOfFirstAppointment,
          entryGradeLevel: fullWorker.entryGradeLevel,
          entryStep: fullWorker.entryStep,
          dateOfPresentAppointment: fullWorker.dateOfPresentAppointment,
          dateOfConfirmation: fullWorker.dateOfConfirmation,
          confirmationGradeLevel: fullWorker.confirmationGradeLevel,
          confirmationStep: fullWorker.confirmationStep,
          gradeLevel: fullWorker.gradeLevel,
          step: fullWorker.step,
          designation: fullWorker.designation,
          salaryAmount: fullWorker.salaryAmount,
          ministry: fullWorker.ministry,
          department: fullWorker.department,
          highestQualification: fullWorker.highestQualification,
          nyscYear: fullWorker.nyscYear,
          nyscStatus: (fullWorker.nyscStatus as any),
          isSuspended: fullWorker.isSuspended,
          promotions: (fullWorker.promotions as any),
          certificates: (fullWorker.certificates as any),
          careerActions: (fullWorker.careerActions as any),
          leaveRecords: (fullWorker.leaveRecords as any),
          stateId: fullWorker.stateId,
          cadreId: fullWorker.cadreId,
          isConfirmed: fullWorker.isConfirmed,
          appointmentType: fullWorker.appointmentType,
          retirementAge: retirementRule?.retirementAge,
          maxServiceYears: retirementRule?.maxServiceYears,
          promotionIntervalRules: fullWorker.cadre?.promotionIntervals as any,
          requiresNYSC: fullWorker.cadre?.requiresNYSC,
          entryRequirements: fullWorker.cadre?.entryRequirements as any,
          minGradeLevel: fullWorker.cadre?.minGradeLevel,
          maxGradeLevel: fullWorker.cadre?.maxGradeLevel,
          requiresProfessionalCert: fullWorker.cadre?.requiresProfessionalCert || false
        });

        // 6. Update Flags
        await tx.worker.update({
          where: { id: workerId },
          data: {
            isFlagged: auditRes.isFlagged,
            flagReason: auditRes.flagReason.join(" | "),
            flagSeverity: auditRes.severity
          }
        });
      }

      revalidatePath(`/dashboard/states/${(updatedWorker as any).state?.code}/workers/${workerId}/documents`);
      revalidatePath(`/dashboard/states/${(updatedWorker as any).state?.code}/workers`);

      return { success: true, worker: JSON.parse(JSON.stringify(updatedWorker)) };
    });
  } catch (error) {
    console.error("Failed to audit worker profile:", error);
    return { success: false, error: "Failed to save audit results" };
  }
}
// New action: Verify Worker
export async function verifyWorker(workerId: string, isVerified: boolean) {
  try {
    await requireAuth();
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: { isVerified },
      select: { stateId: true, state: { select: { code: true } } }
    });

    // Revalidate paths to update UI
    revalidatePath("/dashboard/workers");
    revalidatePath(`/dashboard/states/${worker.state.code}/workers`);
    revalidatePath(`/dashboard/states/${worker.state.code}/workers/${workerId}`);

    return { success: true, worker: JSON.parse(JSON.stringify(worker)) };
  } catch (error) {
    console.error("Failed to verify worker:", error);
    return { success: false, error: "Failed to verify worker" };
  }
}

export async function processCareerAction(workerId: string, actionData: {
  type: CareerActionType;
  actionDate: string;
  newGradeLevel: string;
  newStep: string;
  newDesignation?: string;
  authorityReference?: string;
  gazetteNumber?: string;
  effectiveDate: string;
  remarks?: string;
}) {
  try {
    await requireAuth();
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { state: true, cadre: true }
    });

    if (!worker) return { success: false, error: "Worker not found" };

    // 1. Calculate Financial Impact
    const prevSalaryRes = await getEnhancedSalary({
      stateId: worker.stateId,
      cadreId: worker.cadreId,
      gradeLevel: worker.gradeLevel || "01",
      step: worker.step || "01"
    });

    const newSalaryRes = await getEnhancedSalary({
      stateId: worker.stateId,
      cadreId: worker.cadreId,
      gradeLevel: actionData.newGradeLevel,
      step: actionData.newStep
    });

    const previousSalary = prevSalaryRes?.grossSalary || 0;
    const newSalary = newSalaryRes?.grossSalary || 0;

    // 2. Execute Transaction
    return await prisma.$transaction(async (tx: any) => {
      // a. Create Career Action record
      const action = await (tx as any).careerAction.create({
        data: {
          workerId,
          type: actionData.type,
          effectiveDate: new Date(actionData.effectiveDate),

          fromGradeLevel: worker.gradeLevel || "01",
          fromStep: worker.step || "01",
          toGradeLevel: actionData.newGradeLevel,
          toStep: actionData.newStep,

          fromDesignation: worker.designation,
          toDesignation: actionData.newDesignation || worker.designation,

          authorityReference: actionData.authorityReference,
          gazetteNumber: actionData.gazetteNumber,

          fromSalary: previousSalary,
          toSalary: newSalary,
          remarks: actionData.remarks
        }
      });

      // b. Update Worker record
      await tx.worker.update({
        where: { id: workerId },
        data: {
          gradeLevel: actionData.newGradeLevel,
          step: actionData.newStep,
          designation: actionData.newDesignation || worker.designation,
          dateOfPresentAppointment: new Date(actionData.effectiveDate),
          salaryAmount: newSalary.toString(),

          // Logic for specific types
          ...(actionData.type === "CONFIRMATION" ? {
            isConfirmed: true,
            dateOfConfirmation: new Date(actionData.actionDate),
            confirmationGradeLevel: actionData.newGradeLevel,
            confirmationStep: actionData.newStep,
            confirmationLetterRef: actionData.authorityReference
          } : {})
        }
      });

      revalidatePath(`/dashboard/states/${worker.state.code}/workers/${workerId}`);
      revalidatePath(`/dashboard/states/${worker.state.code}/workers`);

      return { success: true, action: JSON.parse(JSON.stringify(action)) };
    });

  } catch (error) {
    console.error("Career Action Error:", error);
    return { success: false, error: "Failed to process career action" };
  }
}

export async function fetchCadresByStateAction(stateCode: string) {
  try {
    await requireAuth();
    const state = await prisma.state.findUnique({
      where: { code: stateCode.toUpperCase() },
      select: { id: true }
    });

    if (!state) return { success: false, error: "State not found" };

    const cadres = await prisma.cadre.findMany({
      where: { stateId: state.id },
      orderBy: { name: 'asc' }
    });

    return { success: true, cadres: JSON.parse(JSON.stringify(cadres)) };
  } catch (error) {
    console.error("Failed to fetch cadres:", error);
    return { success: false, error: "Failed to fetch cadres" };
  }
}
