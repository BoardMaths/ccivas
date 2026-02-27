import { z } from "zod";

// State validation schemas
export const createStateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be less than 10 characters"),
});

// Worker validation schemas
export const createWorkerSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last Name is required"),
  stateId: z.string().cuid("Invalid state ID"),
  staffId: z.string().optional(),

  dob: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  placeOfBirth: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  lgaOfOrigin: z.string().optional(),
  phone: z.string().optional(),

  nin: z.string().optional(),

  dateOfFirstAppointment: z.string().optional(),
  entryGradeLevel: z.string().optional(),
  entryStep: z.string().optional(),
  dateOfPresentAppointment: z.string().optional(),
  dateOfConfirmation: z.string().optional(),
  confirmationGradeLevel: z.string().optional(),
  confirmationStep: z.string().optional(),
  confirmationLetterRef: z.string().optional(),
  gradeLevel: z.string().optional(),
  step: z.string().optional(),
  designation: z.string().optional(),
  salaryAmount: z.string().optional(),
  ministry: z.string().optional(),
  department: z.string().optional(),

  highestQualification: z.string().optional(),
  nyscStatus: z.enum(["DISCHARGED", "EXEMPTED", "EXCLUDED", "NONE"]).optional(),
  nyscYear: z.string().optional(),
  nyscState: z.string().optional(),
  nyscNumber: z.string().optional(),

  isSuspended: z.boolean().optional(),
  suspensionDate: z.string().optional(),
  suspensionReason: z.string().optional(),
  lastStepIncrementDate: z.string().optional(),

  promotions: z.array(z.object({
    date: z.string(),
    gradeLevel: z.string(),
    step: z.string().optional(),
    designation: z.string().optional(),
    salary: z.string().optional(),
    authorityReference: z.string().optional(),
    gazetteNumber: z.string().optional(),
  })).optional(),

  certificates: z.array(z.object({
    type: z.string(),
    institution: z.string(),
    year: z.string(),
    certificateNumber: z.string().optional(),
  })).optional(),

  // Enhanced Civil Service Fields
  cadreId: z.string().optional(),
  appointmentType: z.enum(["PERMANENT_PENSIONABLE", "PROBATION", "CONTRACT", "TEMPORARY", "SECONDMENT", "ACTING"]).optional(),
  isConfirmed: z.boolean().optional(),
  postTitle: z.string().optional(),
  postCode: z.string().optional(),

  // Registry & Administrative
  fileNumber: z.string().optional(),
  ippisNumber: z.string().optional(),

  // Financial
  bvn: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  pfaName: z.string().optional(),
  rsaNumber: z.string().optional(),

  // Medical
  bloodGroup: z.string().optional(),
  genotype: z.string().optional(),

  // Next of Kin
  nextOfKinName: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),

  // Address
  residentialAddress: z.string().optional(),
});

export const careerActionSchema = z.object({
  workerId: z.string().cuid(),
  type: z.enum([
    "PROMOTION",
    "CONVERSION",
    "ADVANCEMENT",
    "CONFIRMATION",
    "TRANSFER",
    "SECONDMENT",
    "ACTING_APPOINTMENT",
    "REDEPLOYMENT",
    "DEMOTION"
  ]),
  effectiveDate: z.string().min(1, "Effective date is required"),
  toGradeLevel: z.string().min(2, "Grade Level is required"),
  toStep: z.string().min(2, "Step is required"),
  toDesignation: z.string().optional(),
  toSalary: z.string().optional(),
  authorityReference: z.string().optional(),
  gazetteNumber: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateWorkerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
});

// Project validation schemas
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  stateId: z.string().cuid("Invalid state ID"),
});

export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  status: z.enum(["ONGOING", "COMPLETED", "CANCELLED", "PENDING"]).optional(),
});

// User role validation
export const updateUserRoleSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  newRole: z.enum(["SUPERADMIN", "ADMIN", "USER"]),
});

// Document validation schemas
export const createDocumentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be less than 200 characters")
    .optional(),
  url: z.string().url("Invalid document URL"),
  type: z.enum([
    "BIRTH_CERTIFICATE_AGE_DECLARATION",
    "NOTIFICATION_OF_APPOINTMENT",
    "CONVERSION_TO_PERMANENT_APPOINTMENT",
    "CONFIRMATION_OF_APPOINTMENT",
    "NOTIFICATION_OF_PROMOTION",
    "FIRST_SCHOOL_LEAVING_CERTIFICATE",
    "SCHOOL_CERTIFICATE",
    "NYSC_DISCHARGE_CERTIFICATE",
    "NYSC_EXEMPTION_CERTIFICATE",
    "NYSC_EXCLUSION_LETTER",
    "NIN_SLIP",
    "OTHER",
  ]),
  workerId: z.string().cuid("Invalid worker ID"),
});

export type CreateStateInput = z.infer<typeof createStateSchema>;
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
