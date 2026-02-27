
import { calculateSalary, formatNaira } from "./salary-utils";

/**
 * Audit Rules Engine for Nigerian Civil Service Personnel
 * This file centralizes all logic for flagging records based on 
 * civil service regulations (Schemes of Service).
 * 
 * Comprehensive validation includes:
 * - Entry age and qualification requirements
 * - Promotion interval compliance
 * - Salary consistency checks
 * - Date logic validations
 * - Confirmation period rules
 * - Step progression validations
 * - Ministry/Department requirements
 * - Academic certificate validations
 * - Promotion history analysis
 * - Financial impact assessments
 */

export interface AuditResult {
    isFlagged: boolean;
    flagReason: string[];
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CareerActionRecord {
    id: string;
    type: string;
    effectiveDate: string | Date;
    toGradeLevel: string;
    toStep: string;
    toDesignation?: string | null;
    toSalary?: any;
    authorityReference?: string | null;
    gazetteNumber?: string | null;
}

export interface PromotionRecord {
    date: string | Date;
    gradeLevel: string;
    step?: string;
    designation?: string;
    salary?: string;
    authorityReference?: string;
    gazetteNumber?: string;
}

export interface CertificateRecord {
    type: string;
    institution: string;
    year: string;
    certificateNumber?: string;
}

export interface WorkerAuditData {
    // Personal Information
    dob?: string | Date | null;

    // Employment Dates
    dateOfFirstAppointment?: string | Date | null;
    dateOfPresentAppointment?: string | Date | null;
    dateOfConfirmation?: string | Date | null;

    // Entry Details
    entryGradeLevel?: string | null;
    entryStep?: string | null;

    // Current Position
    gradeLevel?: string | null;
    step?: string | null;
    designation?: string | null;
    rank?: string | null;

    // Salary Information
    salaryScale?: string | null;
    salaryAmount?: string | null;

    // Confirmation Details
    confirmationGradeLevel?: string | null;
    confirmationStep?: string | null;
    confirmationLetterRef?: string | null;

    // Education & NYSC
    highestQualification?: string | null;
    nyscYear?: string | null;
    nyscStatus?: 'DISCHARGED' | 'EXEMPTED' | 'EXCLUDED' | 'NONE';

    // Status
    isSuspended?: boolean;

    // Related Records
    promotions?: PromotionRecord[];
    careerActions?: CareerActionRecord[];
    certificates?: CertificateRecord[];
    leaveRecords?: LeaveRecord[];

    // NEW FIELDS FOR ENHANCED CIVAS
    stateId?: string | null;
    cadreId?: string | null;
    isConfirmed?: boolean;
    appointmentType?: string | null;
    ministry?: string | null;
    department?: string | null;
    requiresProfessionalCert?: boolean;

    // Injected Rules (fetched from DB)
    retirementAge?: number | null;
    maxServiceYears?: number | null;
    promotionIntervalRules?: Record<string, number> | null;
    requiresNYSC?: boolean;
    entryRequirements?: Record<string, any> | null;
    minGradeLevel?: string | null;
    maxGradeLevel?: string | null;
}

export interface LeaveRecord {
    type: string;
    startDate: string | Date;
    endDate: string | Date;
    status: string;
}

/**
 * Qualification to Entry Grade Level Mapping
 */
const QUALIFICATION_ENTRY_LEVELS: Record<string, number> = {
    "FSLC": 2,
    "SSCE": 4,
    "WAEC": 4,
    "GCE": 4,
    "NECO": 4,
    "OND": 6,
    "NCE": 6,
    "BSC": 8,
    "BA": 8,
    "HND": 8,
    "BENG": 8,
    "MSC": 8,
    "MA": 8,
    "MENG": 8,
    "PHD": 9,
};

/**
 * Runs all validation rules against worker data
 * @param data The worker data to audit
 * @returns An object containing flagging status and reasons
 */
export function runAuditRules(data: WorkerAuditData): AuditResult {
    const flags: string[] = [];
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const now = new Date();

    const dob = data.dob ? new Date(data.dob) : null;
    const dofa = data.dateOfFirstAppointment ? new Date(data.dateOfFirstAppointment) : null;
    const dopa = data.dateOfPresentAppointment ? new Date(data.dateOfPresentAppointment) : null;
    const doco = data.dateOfConfirmation ? new Date(data.dateOfConfirmation) : null;
    const gl = data.gradeLevel ? parseInt(data.gradeLevel) : null;
    const currentStep = data.step ? parseInt(data.step) : null;

    // =============================================================================
    // SECTION 1: PSR Rule 020205 - Entry Age Limits
    // =============================================================================
    // Rule: Every applicant must not be less than 18 years and not more than 50 years of age.
    if (dob && dofa) {
        const ageAtEntry = (dofa.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (ageAtEntry < 18) {
            flags.push(`PSR Rule 020205: Underage Entry - Personnel was ${ageAtEntry.toFixed(1)} years old at appointment (Minimum 18).`);
        } else if (ageAtEntry > 50) {
            flags.push(`PSR Rule 020205: Overage Entry - Personnel was ${ageAtEntry.toFixed(1)} years old at appointment (Maximum 50).`);
        }
    }

    // =============================================================================
    // SECTION 2: Qualification-Based Entry Validations (Scheme of Service)
    // =============================================================================
    if (data.highestQualification && data.entryGradeLevel) {
        const qualKey = data.highestQualification.toUpperCase();
        const actualEntryGL = parseInt(data.entryGradeLevel);

        // 2.1: Check against hardcoded defaults
        const expectedEntryGL = QUALIFICATION_ENTRY_LEVELS[qualKey];
        if (expectedEntryGL && !isNaN(actualEntryGL)) {
            if (actualEntryGL < expectedEntryGL) {
                flags.push(`Scheme of Service: ${data.highestQualification} holders must enter at GL ${expectedEntryGL.toString().padStart(2, '0')} or higher. Entered at GL ${actualEntryGL.toString().padStart(2, '0')}.`);
            }
        }

        // 2.2: Check against Cadre-specific entry requirements (Strict Mapping)
        if (data.entryRequirements && data.entryRequirements[qualKey]) {
            const rule = data.entryRequirements[qualKey];
            if (rule.gl && actualEntryGL < parseInt(rule.gl)) {
                flags.push(`Cadre Specific Rule: ${data.highestQualification} entry for this cadre must be GL ${rule.gl}. Entered at GL ${actualEntryGL.toString().padStart(2, '0')}.`);
            }
            if (rule.designation && data.designation && data.designation !== rule.designation) {
                flags.push(`Cadre Specific Rule: ${data.highestQualification} entry designation must be "${rule.designation}". Currently listed as "${data.designation}".`);
            }
        }
    }

    // 2.3: Professional Certificate Check
    if (data.requiresProfessionalCert && (!data.certificates || !data.certificates.some(c => c.type.toLowerCase().includes('professional') || c.type.toLowerCase().includes('license')))) {
        flags.push(`Scheme of Service: This cadre requires a Professional Certificate/License which is missing from records.`);
        severity = 'MEDIUM';
    }

    // 2.4: Grade Level Limits (Scheme of Service)
    if (gl !== null) {
        if (data.minGradeLevel) {
            const minGL = parseInt(data.minGradeLevel);
            if (!isNaN(minGL) && gl < minGL) {
                flags.push(`Scheme of Service: Current Grade Level (GL ${gl.toString().padStart(2, '0')}) is below the minimum allowed for this cadre (GL ${minGL.toString().padStart(2, '0')}).`);
            }
        }
        if (data.maxGradeLevel) {
            const maxGL = parseInt(data.maxGradeLevel);
            if (!isNaN(maxGL) && gl > maxGL) {
                flags.push(`Scheme of Service: Current Grade Level (GL ${gl.toString().padStart(2, '0')}) exceeds the maximum allowed for this cadre (GL ${maxGL.toString().padStart(2, '0')}).`);
            }
        }
    }

    // =============================================================================
    // SECTION 3: Date Logic Validations
    // =============================================================================

    // 3.1: DOB cannot be after appointment
    if (dob && dofa && dob >= dofa) {
        flags.push(`Data Integrity: Date of Birth (${dob.toISOString().split('T')[0]}) cannot be on or after Date of First Appointment (${dofa.toISOString().split('T')[0]}).`);
    }

    // 3.2: Future dates validation
    if (dopa && dopa > now) {
        flags.push(`Data Integrity: Date of Present Appointment (${dopa.toISOString().split('T')[0]}) is in the future.`);
    }
    if (dofa && dofa > now) {
        flags.push(`Data Integrity: Date of First Appointment (${dofa.toISOString().split('T')[0]}) is in the future.`);
    }
    if (doco && doco > now) {
        flags.push(`Data Integrity: Date of Confirmation (${doco.toISOString().split('T')[0]}) is in the future.`);
    }

    // 3.3: Appointment sequence validation
    if (dofa && dopa && dopa < dofa) {
        flags.push(`Data Integrity: Date of Present Appointment (${dopa.toISOString().split('T')[0]}) cannot be before Date of First Appointment (${dofa.toISOString().split('T')[0]}).`);
    }

    // 3.4: Confirmation after first appointment
    if (dofa && doco && doco < dofa) {
        flags.push(`Data Integrity: Date of Confirmation (${doco.toISOString().split('T')[0]}) cannot be before Date of First Appointment (${dofa.toISOString().split('T')[0]}).`);
    }

    // 3.5: Retirement Warning
    if (dob || dofa) {
        const retirementRuleAge = data.retirementAge || 60;
        const retirementRuleService = data.maxServiceYears || 35;

        let ageAtRetirement = 0;
        let serviceAtRetirement = 0;

        if (dob) {
            ageAtRetirement = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        }
        if (dofa) {
            serviceAtRetirement = (now.getTime() - dofa.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        }

        const yearsToAgeRetire = retirementRuleAge - ageAtRetirement;
        const yearsToServiceRetire = retirementRuleService - serviceAtRetirement;

        if ((yearsToAgeRetire > 0 && yearsToAgeRetire <= 2) || (yearsToServiceRetire > 0 && yearsToServiceRetire <= 2)) {
            const reason = yearsToAgeRetire <= 2 ? `age (${retirementRuleAge})` : `service years (${retirementRuleService})`;
            const yearsLeft = Math.min(yearsToAgeRetire, yearsToServiceRetire).toFixed(1);
            flags.push(`PSR Rule 020810: RETIREMENT WARNING - Personnel is within ${yearsLeft} years of statutory retirement by ${reason}. Pre-retirement processing should begin.`);
            severity = 'MEDIUM';
        }
    }

    // =============================================================================
    // SECTION 4: Confirmation Period Validations (PSR Rule 020301)
    // =============================================================================
    // Rule: Officers are on probation for 2 years before confirmation.

    if (dofa && !doco) {
        const serviceYears = (now.getTime() - dofa.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (serviceYears > 2.1 && serviceYears < 5) {
            flags.push(`PSR Rule 020301: Pending Confirmation - Personnel has served ${serviceYears.toFixed(1)} years but hasn't been confirmed (Probation period is 2 years).`);
            severity = 'MEDIUM';
        } else if (serviceYears >= 5) {
            flags.push(`PSR Rule 020301: CRITICAL DELAY - Personnel has served ${serviceYears.toFixed(1)} years without confirmation. This exceeds all allowed extensions.`);
            severity = 'HIGH';
        }
    }

    if (dofa && doco) {
        const probationYears = (doco.getTime() - dofa.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        // Flag if confirmed too early (less than 1.5 years is suspicious)
        if (probationYears < 1.9 && probationYears > 0) {
            flags.push(`PSR Rule 020301: Early Confirmation - Personnel confirmed after ${probationYears.toFixed(1)} years (Standard probation is 2 years). Please verify special waiver.`);
        }

        // Flag if probation was excessively long (more than 2.5 years without explicit extension noted)
        if (probationYears > 2.5) {
            flags.push(`PSR Rule 020301: Delayed Confirmation - Personnel confirmed after ${probationYears.toFixed(1)} years (Standard is 2 years). Negligence or delay in processing detected.`);
            severity = 'LOW';
        }
    }

    // 4.1: Probation Restrictions (Leave & NYSC)
    if (dofa && !data.isConfirmed) {
        const serviceYears = (now.getTime() - dofa.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (serviceYears < 2.0) {
            // Check for leaves during probation
            if (data.leaveRecords && data.leaveRecords.some(l => l.status === 'APPROVED')) {
                flags.push(`PSR Restriction: Personnel is on probation. Officers on probation are not entitled to leaves (except casual/sick leave in emergencies).`);
                severity = 'MEDIUM';
            }

            // Check for NYSC during probation
            if (data.nyscYear && parseInt(data.nyscYear) >= dofa.getFullYear()) {
                flags.push(`PSR Restriction: Personnel cannot undergo NYSC while on probation. NYSC must be completed before or after the 2-year service period.`);
                severity = 'HIGH';
            }
        }
    }

    // Confirmation grade level validation
    if (data.entryGradeLevel && data.confirmationGradeLevel) {
        const entryGL = parseInt(data.entryGradeLevel);
        const confirmGL = parseInt(data.confirmationGradeLevel);

        if (!isNaN(entryGL) && !isNaN(confirmGL)) {
            if (confirmGL < entryGL) {
                flags.push(`Confirmation Validation: Confirmation Grade Level (GL ${confirmGL.toString().padStart(2, '0')}) cannot be lower than Entry Grade Level (GL ${entryGL.toString().padStart(2, '0')}).`);
            }

            // Flag if confirmed more than 2 levels above entry (unusual)
            if (confirmGL > entryGL + 2) {
                flags.push(`Confirmation Validation: Confirmation Grade Level (GL ${confirmGL.toString().padStart(2, '0')}) is ${confirmGL - entryGL} levels above Entry Grade Level (GL ${entryGL.toString().padStart(2, '0')}). Verify promotion during probation.`);
            }
        }
    }

    // Missing confirmation letter reference
    if (doco && (!data.confirmationLetterRef || data.confirmationLetterRef.trim() === "")) {
        flags.push(`Confirmation Validation: Personnel is confirmed but Confirmation Letter Reference is missing.`);
    }

    // Confirmation step validation
    if (data.confirmationStep) {
        const confirmStep = parseInt(data.confirmationStep);
        if (!isNaN(confirmStep) && confirmStep > 15) {
            flags.push(`Confirmation Validation: Confirmation Step (${confirmStep}) exceeds maximum allowed step (15).`);
        }
    }

    // =============================================================================
    // SECTION 5: Step Progression Validations
    // =============================================================================

    if (currentStep !== null && !isNaN(currentStep)) {
        // 5.1: Step exceeds maximum
        if (currentStep > 15) {
            flags.push(`Step Validation: Current Step (${currentStep}) exceeds maximum allowed step (15).`);
        }

        // 5.2: Step is zero or negative
        if (currentStep <= 0) {
            flags.push(`Step Validation: Current Step (${currentStep}) is invalid. Step must be between 1 and 15.`);
        }
    }

    // 5.3: Step without grade level
    if (data.step && (!data.gradeLevel || data.gradeLevel.trim() === "")) {
        flags.push(`Step Validation: Step is specified (${data.step}) but Grade Level is missing.`);
    }

    // 5.4: Entry step validation
    if (data.entryStep) {
        const entryStepNum = parseInt(data.entryStep);
        if (!isNaN(entryStepNum) && entryStepNum > 15) {
            flags.push(`Step Validation: Entry Step (${entryStepNum}) exceeds maximum allowed step (15).`);
        }
    }

    // 5.5: Step regression check (current step lower than entry step at same GL)
    if (data.entryGradeLevel && data.gradeLevel && data.entryStep && data.step) {
        const entryGL = parseInt(data.entryGradeLevel);
        const currentGL = parseInt(data.gradeLevel);
        const entryStepNum = parseInt(data.entryStep);
        const currentStepNum = parseInt(data.step);

        if (!isNaN(entryGL) && !isNaN(currentGL) && !isNaN(entryStepNum) && !isNaN(currentStepNum)) {
            if (entryGL === currentGL && currentStepNum < entryStepNum) {
                flags.push(`Step Validation: Current Step (${currentStepNum}) is lower than Entry Step (${entryStepNum}) at the same Grade Level (GL ${currentGL.toString().padStart(2, '0')}). Step regression detected.`);
            }
        }
    }

    // =============================================================================
    // SECTION 6: Salary Consistency Validations
    // =============================================================================

    if (data.gradeLevel && data.step && data.salaryAmount) {
        const expectedSalary = calculateSalary(
            data.gradeLevel,
            data.step,
            data.salaryScale || "CORE"
        );
        const actualSalary = parseInt(data.salaryAmount);

        if (expectedSalary > 0 && !isNaN(actualSalary)) {
            const difference = Math.abs(actualSalary - expectedSalary);
            const percentageDiff = (difference / expectedSalary) * 100;

            // Flag if salary differs by more than 5% from expected
            if (percentageDiff > 5) {
                flags.push(`Salary Validation: Salary amount (${formatNaira(actualSalary)}) does not match expected salary (${formatNaira(expectedSalary)}) for GL ${data.gradeLevel} Step ${data.step} on ${data.salaryScale || 'CORE'} scale. Difference: ${percentageDiff.toFixed(1)}%.`);
            }
        }
    }

    // Zero or negative salary check
    if (data.salaryAmount) {
        const salary = parseInt(data.salaryAmount);
        if (!isNaN(salary)) {
            if (salary <= 0) {
                flags.push(`Salary Validation: Salary amount (${salary}) is zero or negative. Please verify.`);
            } else if (salary < 20000) {
                flags.push(`Salary Validation: Salary amount (${formatNaira(salary)}) is unusually low. Please verify.`);
            }
        }
    }

    // Salary without grade level
    if (data.salaryAmount && (!data.gradeLevel || data.gradeLevel.trim() === "")) {
        flags.push(`Salary Validation: Salary amount is specified but Grade Level is missing.`);
    }

    // =============================================================================
    // SECTION 7: Ministry/Department Validations
    // =============================================================================

    // Missing ministry for senior positions (GL 10+)
    if (gl && gl >= 10 && (!data.ministry || data.ministry.trim() === "")) {
        flags.push(`Ministry/Department: Senior personnel (GL ${gl.toString().padStart(2, '0')}) should have Ministry assignment. Ministry is missing.`);
    }

    // Department without ministry
    if (data.department && data.department.trim() !== "" && (!data.ministry || data.ministry.trim() === "")) {
        flags.push(`Ministry/Department: Department is specified (${data.department}) but Ministry is missing.`);
    }

    // =============================================================================
    // SECTION 8: PSR Rule 020701 - Promotion Interval & Illegal Promotion Detection
    // =============================================================================

    if (dofa && gl && !isNaN(gl)) {
        // 1. Determine Presumed Entry GL
        let entryGl = data.entryGradeLevel ? parseInt(data.entryGradeLevel) : 8;
        if (!data.entryGradeLevel && data.highestQualification) {
            const qualKey = data.highestQualification.toUpperCase();
            entryGl = QUALIFICATION_ENTRY_LEVELS[qualKey] || 8;
        }

        // 2. Calculate Theoretical Career Progression
        let theoreticalGl = entryGl;
        let theoreticalStep = 1;
        let runningYears = 0;
        const serviceYears = (now.getTime() - dofa.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        // Simulate yearly progression
        for (let year = 1; year <= Math.floor(serviceYears); year++) {
            let yearsForPromo = 3; // Default

            // Use injected cadre-specific rules if available
            if (data.promotionIntervalRules) {
                const currentGLStr = theoreticalGl.toString().padStart(2, '0');
                for (const [range, interval] of Object.entries(data.promotionIntervalRules)) {
                    const [min, max] = range.split('-').map(r => parseInt(r));
                    if (theoreticalGl >= min && theoreticalGl <= max) {
                        yearsForPromo = interval;
                        break;
                    }
                }
            } else {
                // Fallback to standard civil service intervals
                if (theoreticalGl <= 6) yearsForPromo = 2;
                if (theoreticalGl >= 15) yearsForPromo = 4;
            }

            runningYears++;
            if (runningYears >= yearsForPromo) {
                theoreticalGl++;
                theoreticalStep = 1;
                runningYears = 0;
            } else {
                theoreticalStep++;
                if (theoreticalStep > 15) theoreticalStep = 15;
            }
        }

        // 3. Compare with Actual GL - Overpayment Detection
        if (gl > theoreticalGl) {
            const actualSalary = parseInt(data.salaryAmount || "0");
            const theoreticalSalary = calculateSalary(
                theoreticalGl.toString(),
                theoreticalStep.toString(),
                data.salaryScale || "CORE"
            );

            const monthlyDiff = actualSalary > theoreticalSalary ? (actualSalary - theoreticalSalary) / 12 : 0;

            let overpaymentPeriodMonths = 0;
            if (dopa) {
                overpaymentPeriodMonths = ((now.getTime() - dopa.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
            }
            const totalOverpayment = monthlyDiff * overpaymentPeriodMonths;

            if (monthlyDiff > 0) {
                const formattedDiff = formatNaira(totalOverpayment);
                const normalDesc = `GL ${theoreticalGl.toString().padStart(2, '0')} / Step ${theoreticalStep.toString().padStart(2, '0')}`;

                flags.push(`PSR Rule 020701: ILLEGAL PROMOTION DETECTED - Personnel is at GL ${gl.toString().padStart(2, '0')} but theoretically should be at ${normalDesc} based on ${serviceYears.toFixed(1)} years of service and qualification. Estimated Overpayment to Return: ${formattedDiff} (Based on ${overpaymentPeriodMonths.toFixed(0)} months at this level).`);
            }
        }

        // 4. Underpayment Detection (potential exploitation)
        if (gl < theoreticalGl - 1) {
            const normalDesc = `GL ${theoreticalGl.toString().padStart(2, '0')}`;
            flags.push(`Career Progression: Personnel is at GL ${gl.toString().padStart(2, '0')} but should theoretically be at ${normalDesc} based on ${serviceYears.toFixed(1)} years of service. Potential underpayment or stagnation detected.`);
        }
    }

    // =============================================================================
    // SECTION 9: Career & Promotion History Validations
    // =============================================================================

    // Normalize and merge both legacy promotions and modern career actions
    const allHistory = [
        ...(data.promotions || []).map(p => ({
            date: new Date(p.date),
            gl: parseInt(p.gradeLevel),
            step: p.step ? parseInt(p.step) : 1,
            type: 'PROMOTION',
            authorityReference: p.authorityReference,
            gazetteNumber: p.gazetteNumber,
            salary: p.salary
        })),
        ...(data.careerActions || []).map(c => ({
            date: new Date(c.effectiveDate),
            gl: parseInt(c.toGradeLevel),
            step: parseInt(c.toStep),
            type: c.type,
            authorityReference: c.authorityReference,
            gazetteNumber: c.gazetteNumber,
            salary: c.toSalary?.toString()
        }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (allHistory.length > 0) {
        // 9.1: Promo/Action date before first appointment
        for (const history of allHistory) {
            if (dofa && history.date < dofa) {
                flags.push(`${history.type} History: ${history.type} to GL ${history.gl.toString().padStart(2, '0')} on ${history.date.toISOString().split('T')[0]} is before Date of First Appointment (${dofa.toISOString().split('T')[0]}).`);
            }
        }

        // 9.2: Backward movement detection
        for (let i = 1; i < allHistory.length; i++) {
            const prev = allHistory[i - 1];
            const curr = allHistory[i];

            if (!isNaN(curr.gl) && !isNaN(prev.gl) && curr.gl < prev.gl) {
                flags.push(`Career History: Backward movement detected - GL ${prev.gl.toString().padStart(2, '0')} (${prev.date.toISOString().split('T')[0]}) to GL ${curr.gl.toString().padStart(2, '0')} (${curr.date.toISOString().split('T')[0]}). Type: ${curr.type}.`);
            }
        }

        // 9.3: Missing Authority Reference or Gazette Number
        for (const history of allHistory) {
            if (history.gl > 1 && (history.type === 'PROMOTION' || history.type === 'CONVERSION' || history.type === 'ADVANCEMENT')) {
                if (!history.authorityReference || history.authorityReference.trim() === "") {
                    flags.push(`${history.type} History: Action to GL ${history.gl.toString().padStart(2, '0')} is missing Authority Reference.`);
                }
                if (!history.gazetteNumber || history.gazetteNumber.trim() === "") {
                    flags.push(`${history.type} History: Action to GL ${history.gl.toString().padStart(2, '0')} is missing Gazette Number.`);
                }
            }
        }

        // 9.4: Action gaps analysis (Too long OR Too short)
        for (let i = 1; i < allHistory.length; i++) {
            const prev = allHistory[i - 1];
            const curr = allHistory[i];
            const gapYears = (curr.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

            let minRequiredYears = 3;
            if (prev.gl <= 6) minRequiredYears = 2;
            if (prev.gl >= 15) minRequiredYears = 4;

            if (gapYears < minRequiredYears - 0.1 && (curr.type === 'PROMOTION' || curr.type === 'ADVANCEMENT')) {
                flags.push(`Career History: ILLEGAL SPEED - ${curr.type} to GL ${curr.gl.toString().padStart(2, '0')} after only ${gapYears.toFixed(1)} years at GL ${prev.gl.toString().padStart(2, '0')} (Minimum interval is ${minRequiredYears} years).`);
                severity = 'HIGH';
            }

            if (!isNaN(prev.gl) && prev.gl >= 7 && prev.gl <= 14 && gapYears > 6) {
                flags.push(`Career History: Unusually long gap (${gapYears.toFixed(1)} years) between actions. Standard interval is 3 years.`);
            }
        }

        // 9.5: Missing history records
        if (data.entryGradeLevel && data.gradeLevel) {
            const entryGL = parseInt(data.entryGradeLevel);
            const currentGL = parseInt(data.gradeLevel);
            const progressionSteps = allHistory.length;

            if (!isNaN(entryGL) && !isNaN(currentGL)) {
                const expectedAdvances = currentGL - entryGL;
                if (expectedAdvances > progressionSteps + 1) {
                    flags.push(`Career History: Personnel advanced from GL ${entryGL.toString().padStart(2, '0')} to GL ${currentGL.toString().padStart(3, '0')} but only ${progressionSteps} history records exist. Missing progression documentation.`);
                }
            }
        }
    } else {
        // No records but significant GL advancement
        if (data.entryGradeLevel && data.gradeLevel) {
            const entryGL = parseInt(data.entryGradeLevel);
            const currentGL = parseInt(data.gradeLevel);

            if (!isNaN(entryGL) && !isNaN(currentGL) && currentGL > entryGL + 1) {
                flags.push(`Career History: Personnel advanced from GL ${entryGL.toString().padStart(2, '0')} to GL ${currentGL.toString().padStart(2, '0')} but no history records exist. Documentation required.`);
            }
        }
    }

    // =============================================================================
    // SECTION 10: Academic Certificate Validations
    // =============================================================================

    if (data.certificates && data.certificates.length > 0) {
        const certs = data.certificates.map(c => ({
            ...c,
            yearNum: parseInt(c.year)
        })).sort((a, b) => a.yearNum - b.yearNum);

        // 10.1: Certificate year before DOB
        for (const cert of certs) {
            if (dob && !isNaN(cert.yearNum)) {
                const birthYear = dob.getFullYear();
                const ageAtCert = cert.yearNum - birthYear;

                // Flag if certificate obtained before realistic age
                if (ageAtCert < 5 && cert.type.toUpperCase().includes("FSLC")) {
                    flags.push(`Certificate Validation: ${cert.type} certificate year (${cert.year}) suggests completion at age ${ageAtCert}, which is too young.`);
                } else if (ageAtCert < 15 && (cert.type.toUpperCase().includes("SSCE") || cert.type.toUpperCase().includes("WAEC"))) {
                    flags.push(`Certificate Validation: ${cert.type} certificate year (${cert.year}) suggests completion at age ${ageAtCert}, which is too young (typical age 16-18).`);
                } else if (ageAtCert < 20 && (cert.type.toUpperCase().includes("BSC") || cert.type.toUpperCase().includes("HND") || cert.type.toUpperCase().includes("BA"))) {
                    flags.push(`Certificate Validation: ${cert.type} certificate year (${cert.year}) suggests completion at age ${ageAtCert}, which is too young (typical age 21-24).`);
                } else if (ageAtCert < 23 && cert.type.toUpperCase().includes("MSC")) {
                    flags.push(`Certificate Validation: ${cert.type} certificate year (${cert.year}) suggests completion at age ${ageAtCert}, which is too young (typical age 24+).`);
                } else if (ageAtCert < 26 && cert.type.toUpperCase().includes("PHD")) {
                    flags.push(`Certificate Validation: ${cert.type} certificate year (${cert.year}) suggests completion at age ${ageAtCert}, which is too young (typical age 27+).`);
                }
            }
        }

        // 10.2: Certificate progression validation
        for (let i = 1; i < certs.length; i++) {
            const prev = certs[i - 1];
            const curr = certs[i];

            // Check for illogical progression (e.g., BSC after FSLC obtained later)
            const prevLevel = getCertificateLevel(prev.type);
            const currLevel = getCertificateLevel(curr.type);

            if (prevLevel > currLevel && curr.yearNum > prev.yearNum) {
                flags.push(`Certificate Validation: Certificate progression is illogical - ${prev.type} (${prev.year}) is higher than ${curr.type} (${curr.year}) but obtained earlier.`);
            }
        }

        // 10.3: Certificate year in the future
        for (const cert of certs) {
            if (!isNaN(cert.yearNum) && cert.yearNum > now.getFullYear()) {
                flags.push(`Certificate Validation: ${cert.type} certificate year (${cert.year}) is in the future.`);
            }
        }
    }

    // 10.4: Missing certificate records for claimed qualification
    if (data.highestQualification && (!data.certificates || data.certificates.length === 0)) {
        flags.push(`Certificate Validation: Highest qualification is ${data.highestQualification} but no certificate records exist. Documentation required.`);
    }

    // =============================================================================
    // SECTION 11: PSR Rule 020810 - Compulsory Retirement
    // =============================================================================
    // Rule: Compulsory retirement age (typically 60 years or 35 years of service)
    const maxAge = data.retirementAge || 60;
    const maxService = data.maxServiceYears || 35;

    if (dob) {
        const age = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age > maxAge) {
            flags.push(`Compulsory Retirement: Overage Personnel - Current age is ${age.toFixed(1)} years (Maximum ${maxAge}). Personnel should have retired.`);
        }
    }

    if (dofa) {
        const serviceYears = (now.getTime() - dofa.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (serviceYears > maxService) {
            flags.push(`Compulsory Retirement: Service Limit Exceeded - Personnel has served for ${serviceYears.toFixed(1)} years (Maximum ${maxService}). Personnel should have retired.`);
        }
    }

    // =============================================================================
    // SECTION 12: NYSC Requirement Validation
    // =============================================================================
    // Rule: Degree holders and certain diploma holders must complete NYSC before civil service appointment

    const nyscRequiredQualifications = ["BSC", "BA", "BENG", "HND", "MSC", "MA", "MENG", "PHD", "OND", "NCE"];
    const hasNyscRequirement = data.requiresNYSC !== undefined
        ? data.requiresNYSC
        : (data.highestQualification && nyscRequiredQualifications.includes(data.highestQualification.toUpperCase()));

    if (hasNyscRequirement) {
        if (!data.nyscStatus || data.nyscStatus === 'NONE') {
            flags.push(`NYSC Requirement: ${data.highestQualification} holders must provide NYSC Discharge, Exemption, or Exclusion certificate.`);
            severity = 'HIGH';
        } else {
            const nyscYear = parseInt(data.nyscYear || "0");

            if (data.nyscStatus === 'DISCHARGED' && (!data.nyscYear || nyscYear === 0)) {
                flags.push(`NYSC Validation: Personnel marked as Discharged but NYSC Year is missing.`);
            }

            if (nyscYear > now.getFullYear()) {
                flags.push(`Data Integrity: NYSC year (${nyscYear}) is in the future.`);
            }

            if (dofa && !isNaN(nyscYear)) {
                const appointmentYear = dofa.getFullYear();
                if (nyscYear > appointmentYear) {
                    flags.push(`NYSC Requirement: NYSC year (${nyscYear}) is after first appointment (${appointmentYear}). NYSC must be completed before civil service appointment.`);
                }

                // Flag if there's an unusually long gap (>3 years) between NYSC and appointment
                const gapYears = appointmentYear - nyscYear;
                if (gapYears > 3) {
                    flags.push(`NYSC Validation: Unusually long gap (${gapYears} years) between NYSC completion (${nyscYear}) and first appointment (${appointmentYear}). Please verify.`);
                }
            }

            if (dob && !isNaN(nyscYear)) {
                const birthYear = dob.getFullYear();
                const ageAtNysc = nyscYear - birthYear;

                if (ageAtNysc < 18) {
                    flags.push(`Data Integrity: NYSC year (${nyscYear}) suggests completion at age ${ageAtNysc}, which is too young (minimum ~21 after graduation).`);
                } else if (ageAtNysc > 35) {
                    flags.push(`Data Integrity: NYSC year (${nyscYear}) suggests completion at age ${ageAtNysc}, which is unusually late. Please verify.`);
                }
            }
        }
    }

    // =============================================================================
    // SECTION 13: Financial Impact Assessment & Severity Classification
    // =============================================================================

    // Calculate total financial impact from illegal promotions
    const illegalPromotionFlags = flags.filter(f => f.includes("ILLEGAL PROMOTION DETECTED"));
    if (illegalPromotionFlags.length > 0) {
        // Extract overpayment amount from flag message
        const overpaymentMatch = illegalPromotionFlags[0].match(/₦\s*([\d,]+)/);
        if (overpaymentMatch) {
            const overpaymentStr = overpaymentMatch[1].replace(/,/g, '');
            const overpayment = parseInt(overpaymentStr);

            if (!isNaN(overpayment)) {
                if (overpayment >= 1000000) {
                    severity = 'CRITICAL';
                    flags.push(`⚠️ CRITICAL FINANCIAL IMPACT: Estimated overpayment exceeds ₦1,000,000. Immediate investigation required.`);
                } else if (overpayment >= 500000) {
                    severity = 'CRITICAL';
                    flags.push(`⚠️ HIGH-RISK OVERPAYMENT: Estimated overpayment exceeds ₦500,000. Priority investigation recommended.`);
                } else if (overpayment >= 200000) {
                    severity = 'HIGH';
                } else if (overpayment >= 50000) {
                    severity = 'MEDIUM';
                }
            }
        }
    }

    // Adjust severity based on other critical flags
    if (flags.some(f => f.includes("Backward promotion") || f.includes("Overage Personnel") || f.includes("Service Limit Exceeded"))) {
        if (severity === 'LOW') severity = 'MEDIUM';
    }

    if (flags.some(f => f.includes("DOB") && f.includes("cannot be"))) {
        severity = 'HIGH';
    }

    // =============================================================================
    // SECTION 14: Confirmation Restrictions
    // =============================================================================

    if (data.isConfirmed === false) {
        // Flag if promoted while unconfirmed
        if (data.promotions && data.promotions.length > 0) {
            flags.push(`Confirmation Restriction: Personnel is not confirmed but has promotion records. Promotion is prohibited before confirmation.`);
            if (severity === 'LOW') severity = 'MEDIUM';
        }

        // Flag if at high GL (> entry + 1) while unconfirmed
        if (data.entryGradeLevel && data.gradeLevel) {
            const entryGL = parseInt(data.entryGradeLevel);
            const currentGL = parseInt(data.gradeLevel);
            if (currentGL > entryGL + 1) {
                flags.push(`Confirmation Restriction: Personnel is at GL ${currentGL.toString().padStart(2, '0')} but is not yet confirmed. High Grade Level without confirmation is irregular.`);
                severity = 'HIGH';
            }
        }
    }

    // =============================================================================
    // SECTION 15: Suspension & Leave Handling
    // =============================================================================
    if (data.isSuspended) {
        flags.push(`⚠️ SUSPENSION: Personnel is currently under suspension. NO SALARY should be paid for this period.`);
        severity = 'CRITICAL';
    }

    if (data.leaveRecords) {
        const activeLeave = data.leaveRecords.find((l: LeaveRecord) => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            return now >= start && now <= end && l.status === 'APPROVED';
        });

        if (activeLeave) {
            if (activeLeave.type === 'STUDY_WITHOUT_PAY') {
                flags.push(`💰 Leave Audit: Personnel is on Study Leave WITHOUT Pay. Verify salary stoppage.`);
                severity = 'MEDIUM';
            } else if (activeLeave.type === 'SABBATICAL') {
                flags.push(`ℹ️ Leave Info: Personnel is on Sabbatical Leave.`);
            }
        }
    }

    // =============================================================================
    // SECTION 16: Professional Certification & PSR 100211
    // =============================================================================

    // PSR 130126: Professionals must maintain valid registration with their respective bodies
    if (data.requiresProfessionalCert) {
        const hasProfessionalCert = (data.certificates || []).some(c =>
            c.type.toUpperCase().includes("PROFESSIONAL") ||
            c.type.toUpperCase().includes("COREN") ||
            c.type.toUpperCase().includes("ICAN") ||
            c.type.toUpperCase().includes("ANAN") ||
            c.type.toUpperCase().includes("NMC") ||
            c.type.toUpperCase().includes("MDCN") ||
            c.type.toUpperCase().includes("VCN") ||
            c.type.toUpperCase().includes("SURCON")
        );

        if (!hasProfessionalCert) {
            flags.push(`Professional Audit: Cadre requires professional certification but none found in records. Valid registration (e.g., ICAN, COREN, MDCN) is required for this position.`);
            severity = 'HIGH';
        }
    }

    // PSR 100211: "A person on probation is not entitled to any leave other than sick leave or maternity leave."
    if (data.leaveRecords && (data.appointmentType === 'PROBATION' || data.isConfirmed === false)) {
        const restrictedLeave = data.leaveRecords.find(l =>
            !l.type.toUpperCase().includes("SICK") &&
            !l.type.toUpperCase().includes("MATERNITY") &&
            l.status === 'APPROVED'
        );
        if (restrictedLeave) {
            flags.push(`PSR Rule 100211: Personnel is on probation/unconfirmed but was granted ${restrictedLeave.type}. Only Sick or Maternity leave is permitted during probation.`);
            if (severity === 'LOW') severity = 'MEDIUM';
        }
    }

    return {
        isFlagged: flags.length > 0,
        flagReason: flags,
        severity: flags.length > 0 ? severity : undefined
    };
}

/**
 * Helper function to determine certificate level for progression validation
 */
function getCertificateLevel(certType: string): number {
    const type = certType.toUpperCase();
    if (type.includes("PHD")) return 6;
    if (type.includes("MSC") || type.includes("MA") || type.includes("MENG")) return 5;
    if (type.includes("BSC") || type.includes("BA") || type.includes("HND") || type.includes("BENG")) return 4;
    if (type.includes("OND") || type.includes("NCE")) return 3;
    if (type.includes("SSCE") || type.includes("WAEC") || type.includes("GCE") || type.includes("NECO")) return 2;
    if (type.includes("FSLC")) return 1;
    return 0;
}
