
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to add "PROBATION" to AppointmentType enum...');
        // We use $executeRawUnsafe because ALTER TYPE cannot be used in transactions
        // which Prisma usually wraps $executeRaw in.
        await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'PROBATION'`);
        console.log('Successfully added "PROBATION" to AppointmentType enum (if it was missing).');

        await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'SECONDMENT'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'ACTING'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'PERMANENT_PENSIONABLE'`);

        console.log('All missing enum values added.');
    } catch (err) {
        console.error('Error updating enum:', err);
        // If it fails with "already exists", it's fine.
        if (err.message.includes('already exists')) {
            console.log('Enum value already exists, no action needed.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
