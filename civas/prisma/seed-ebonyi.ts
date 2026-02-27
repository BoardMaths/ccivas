import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Use require to ensure environment variables are loaded before prisma client is initialized
const { prisma } = require('../src/lib/prisma');

async function main() {
    console.log('🌱 Starting seed for Ebonyi State...');

    // 1. Create or get Ebonyi State
    const ebonyiState = await prisma.state.upsert({
        where: { code: 'EB' },
        update: {},
        create: {
            name: 'Ebonyi',
            code: 'EB',
        },
    });

    console.log('✅ Ebonyi State created/found:', ebonyiState.name);

    // 2. Create Cadres for Ebonyi State (Based on Nigerian Civil Service Scheme of Service)
    const cadres = [
        {
            name: 'Administrative',
            code: 'ADM',
            description: 'Administrative and Executive Officers',
            minGradeLevel: '03',
            maxGradeLevel: '17',
            promotionIntervals: {
                '03-06': 2,
                '07-14': 3,
                '15-17': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: false,
        },
        {
            name: 'Teaching',
            code: 'TCH',
            description: 'Teaching Staff (Primary, Secondary, Tertiary)',
            minGradeLevel: '07',
            maxGradeLevel: '16',
            promotionIntervals: {
                '07-14': 3,
                '15-16': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: true, // Teaching certificate required
        },
        {
            name: 'Medical and Health',
            code: 'MED',
            description: 'Medical Doctors, Nurses, Health Workers',
            minGradeLevel: '08',
            maxGradeLevel: '17',
            promotionIntervals: {
                '08-14': 3,
                '15-17': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: true, // Medical license required
        },
        {
            name: 'Engineering',
            code: 'ENG',
            description: 'Engineers (Civil, Electrical, Mechanical, etc.)',
            minGradeLevel: '08',
            maxGradeLevel: '17',
            promotionIntervals: {
                '08-14': 3,
                '15-17': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: true, // COREN registration required
        },
        {
            name: 'Accounting and Finance',
            code: 'ACC',
            description: 'Accountants, Auditors, Finance Officers',
            minGradeLevel: '07',
            maxGradeLevel: '17',
            promotionIntervals: {
                '07-14': 3,
                '15-17': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: true, // ICAN/ANAN required for senior positions
        },
        {
            name: 'Legal',
            code: 'LEG',
            description: 'Legal Officers, State Counsel',
            minGradeLevel: '08',
            maxGradeLevel: '17',
            promotionIntervals: {
                '08-14': 3,
                '15-17': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: true, // Called to Bar required
        },
        {
            name: 'Information Technology',
            code: 'IT',
            description: 'IT Officers, System Administrators, Programmers',
            minGradeLevel: '07',
            maxGradeLevel: '16',
            promotionIntervals: {
                '07-14': 3,
                '15-16': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: false,
        },
        {
            name: 'Agriculture',
            code: 'AGR',
            description: 'Agricultural Officers, Extension Workers',
            minGradeLevel: '07',
            maxGradeLevel: '16',
            promotionIntervals: {
                '07-14': 3,
                '15-16': 4,
            },
            requiresNYSC: true,
            requiresProfessionalCert: false,
        },
        {
            name: 'Clerical and Secretarial',
            code: 'CLS',
            description: 'Clerks, Typists, Secretaries',
            minGradeLevel: '02',
            maxGradeLevel: '10',
            promotionIntervals: {
                '02-06': 2,
                '07-10': 3,
            },
            requiresNYSC: false,
            requiresProfessionalCert: false,
        },
        {
            name: 'Drivers and Messengers',
            code: 'DRM',
            description: 'Drivers, Messengers, Cleaners',
            minGradeLevel: '01',
            maxGradeLevel: '06',
            promotionIntervals: {
                '01-06': 2,
            },
            requiresNYSC: false,
            requiresProfessionalCert: false,
        },
    ];

    console.log('📚 Creating cadres...');

    for (const cadreData of cadres) {
        const cadre = await prisma.cadre.upsert({
            where: {
                stateId_code: {
                    stateId: ebonyiState.id,
                    code: cadreData.code,
                },
            },
            update: cadreData,
            create: {
                ...cadreData,
                stateId: ebonyiState.id,
            },
        });
        console.log(`  ✅ ${cadre.name} (${cadre.code})`);
    }

    // 3. Create Retirement Rules for Ebonyi State
    console.log('📜 Creating retirement rules...');

    // Default retirement rule (60 years or 35 years service)
    const defaultRule = await prisma.stateRetirementRule.findFirst({
        where: {
            stateId: ebonyiState.id,
            cadreId: null,
            effectiveDate: new Date('2020-01-01'),
        },
    });

    if (!defaultRule) {
        await prisma.stateRetirementRule.create({
            data: {
                stateId: ebonyiState.id,
                cadreId: null,
                retirementAge: 60,
                maxServiceYears: 35,
                effectiveDate: new Date('2020-01-01'),
                remarks: 'Default retirement rule for all cadres',
            },
        });
        console.log('  ✅ Default retirement rule (60 years / 35 years service) created');
    } else {
        console.log('  ✅ Default retirement rule (60 years / 35 years service) already exists');
    }

    // Special rule for Teaching cadre in Ebonyi (65 years)
    const teachingCadre = await prisma.cadre.findFirst({
        where: {
            stateId: ebonyiState.id,
            code: 'TCH',
        },
    });

    if (teachingCadre) {
        const teachingRule = await prisma.stateRetirementRule.findFirst({
            where: {
                stateId: ebonyiState.id,
                cadreId: teachingCadre.id,
                effectiveDate: new Date('2020-01-01'),
            },
        });

        if (!teachingRule) {
            await prisma.stateRetirementRule.create({
                data: {
                    stateId: ebonyiState.id,
                    cadreId: teachingCadre.id,
                    retirementAge: 65,
                    maxServiceYears: 35,
                    effectiveDate: new Date('2020-01-01'),
                    remarks: 'Special retirement age for teaching staff in Ebonyi State',
                },
            });
            console.log('  ✅ Teaching cadre special rule (65 years / 35 years service) created');
        } else {
            console.log('  ✅ Teaching cadre special rule (65 years / 35 years service) already exists');
        }
    }

    // 4. Create a sample salary structure (placeholder - to be updated with actual data)
    console.log('💰 Creating sample salary structure...');

    const salaryStructure = await prisma.salaryStructure.create({
        data: {
            name: 'Ebonyi State General Salary Structure 2024',
            description: 'General salary structure for Ebonyi State - To be updated with actual figures',
            effectiveDate: new Date('2024-01-01'),
            stateId: ebonyiState.id,
            cadreId: null, // Applies to all cadres
        },
    });

    console.log('  ✅ Salary structure created (placeholder)');

    // Create sample salary grades (just a few examples)
    const sampleGrades = [
        { gl: '08', step: '01', basic: 42000, housing: 15000, transport: 10000 },
        { gl: '08', step: '05', basic: 45000, housing: 15000, transport: 10000 },
        { gl: '10', step: '01', basic: 47000, housing: 18000, transport: 12000 },
        { gl: '10', step: '05', basic: 50000, housing: 18000, transport: 12000 },
        { gl: '12', step: '01', basic: 55000, housing: 22000, transport: 15000 },
        { gl: '14', step: '01', basic: 65000, housing: 28000, transport: 18000 },
        { gl: '14', step: '05', basic: 70000, housing: 28000, transport: 18000 },
    ];

    for (const grade of sampleGrades) {
        const gross = grade.basic + grade.housing + grade.transport;
        const tax = gross * 0.07; // 7% tax
        const pension = gross * 0.08; // 8% pension
        const net = gross - tax - pension;

        await prisma.salaryGrade.create({
            data: {
                structureId: salaryStructure.id,
                gradeLevel: grade.gl,
                step: grade.step,
                basicSalary: grade.basic,
                housingAllowance: grade.housing,
                transportAllowance: grade.transport,
                grossSalary: gross,
                taxRate: 7.0,
                pensionRate: 8.0,
                nhfRate: 2.5,
                netSalary: net,
            },
        });
    }

    console.log('  ✅ Sample salary grades created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - State: ${ebonyiState.name} (${ebonyiState.code})`);
    console.log(`  - Cadres: ${cadres.length}`);
    console.log(`  - Retirement Rules: 2 (Default + Teaching)`);
    console.log(`  - Salary Structure: 1 (with ${sampleGrades.length} sample grades)`);
    console.log('\n⚠️  Note: Salary figures are placeholders. Update with actual Ebonyi State salary tables.');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
