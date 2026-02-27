
"use server";

import { prisma } from "./prisma";

/**
 * FETCHES enhanced salary details from the database
 * Uses stateId, cadreId, gradeLevel, and step
 * (Moved from salary-utils.ts to prevent client-side bundle issues)
 */
export async function getEnhancedSalary(data: {
    stateId: string;
    cadreId?: string | null;
    gradeLevel: string;
    step: string;
    structureName?: string;
}) {
    try {
        // 1. Find the salary structure for the state
        // If structureName is provided, use it. Otherwise find default for state
        const structure = await prisma.salaryStructure.findFirst({
            where: {
                stateId: data.stateId,
                ...(data.structureName ? { name: data.structureName } : { isDefault: true })
            }
        });

        if (!structure) return null;

        // 2. Find the specific grade level and step
        const grade = await prisma.salaryGrade.findFirst({
            where: {
                structureId: structure.id,
                gradeLevel: data.gradeLevel.padStart(2, '0'),
                step: data.step.padStart(2, '0'),
                ...(data.cadreId ? {
                    OR: [
                        { cadreId: data.cadreId },
                        { cadreId: null }
                    ]
                } : {})
            },
            orderBy: {
                cadreId: 'desc' // specific cadre first
            }
        });

        return grade;
    } catch (error) {
        console.error("[getEnhancedSalary] Error:", error);
        return null;
    }
}

export async function fetchSalaryAction(data: {
    stateId: string;
    cadreId?: string | null;
    gradeLevel: string;
    step: string;
    structureName?: string;
}) {
    const salaryData = await getEnhancedSalary(data);
    if (!salaryData) return { success: false, error: "Salary not found" };
    return { success: true, salary: JSON.parse(JSON.stringify(salaryData)) };
}

/**
 * CREATE a new salary structure (e.g., "CONPSS 2024")
 */
export async function createSalaryStructureAction(data: {
    name: string;
    stateId: string;
    cadreId?: string | null;
    effectiveDate: string;
    description?: string;
    isDefault?: boolean;
}) {
    try {
        const structure = await prisma.salaryStructure.create({
            data: {
                name: data.name,
                stateId: data.stateId,
                cadreId: data.cadreId,
                effectiveDate: new Date(data.effectiveDate),
                description: data.description,
                isDefault: data.isDefault || false
            }
        });

        // If this is set as default, unset others for this state
        if (data.isDefault) {
            await prisma.salaryStructure.updateMany({
                where: {
                    stateId: data.stateId,
                    id: { not: structure.id }
                },
                data: { isDefault: false }
            });
        }

        return { success: true, structure };
    } catch (error) {
        console.error("Failed to create salary structure:", error);
        return { success: false, error: "Failed to create salary structure" };
    }
}

/**
 * BATCH IMPORT salary grades into a structure
 */
export async function importSalaryGradesAction(structureId: string, grades: Array<{
    gradeLevel: string;
    step: string;
    basicSalary: number;
    housingAllowance?: number;
    transportAllowance?: number;
    utilityAllowance?: number;
    grossSalary: number;
    netSalary: number;
}>) {
    try {
        const result = await prisma.salaryGrade.createMany({
            data: grades.map(g => ({
                structureId,
                gradeLevel: g.gradeLevel.padStart(2, '0'),
                step: g.step.padStart(2, '0'),
                basicSalary: g.basicSalary,
                housingAllowance: g.housingAllowance || 0,
                transportAllowance: g.transportAllowance || 0,
                utilityAllowance: g.utilityAllowance || 0,
                grossSalary: g.grossSalary,
                netSalary: g.netSalary
            }))
        });

        return { success: true, count: result.count };
    } catch (error) {
        console.error("Failed to import salary grades:", error);
        return { success: false, error: "Failed to import salary grades" };
    }
}
