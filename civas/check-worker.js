const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
    const workerId = 'cmlh0m2m10000j4nqz4mw0ewh';
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: { state: true }
    });

    if (worker) {
        console.log('Worker found:', JSON.stringify(worker, null, 2));
    } else {
        console.log('Worker NOT found with ID:', workerId);

        const allWorkers = await prisma.worker.findMany({
            take: 5,
            include: { state: true }
        });
        console.log('Sample workers in DB:', JSON.stringify(allWorkers, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
