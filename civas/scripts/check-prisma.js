
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Checking Prisma Client Models...');
    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log('Available Models:', models);

    if (prisma.worker) {
        console.log('Worker model found.');
        // Try to get a worker or just check the schema via types if possible
        // In JS we can't easily check types but we can try to query a non-existent field to see if it throws a specific error
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
