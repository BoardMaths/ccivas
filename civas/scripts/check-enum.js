
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'AppointmentType'
    `;
        console.log('Current AppointmentType Enum Labels in DB:');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error fetching enum labels:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
