import 'dotenv/config';
import { prisma } from './src/lib/prisma.js';

async function main() {
    const workers = await prisma.worker.findMany({
        take: 5,
        include: { state: true }
    });

    console.log('Total workers:', await prisma.worker.count());
    console.log('Sample workers:', JSON.stringify(workers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
