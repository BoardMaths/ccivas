import { PrismaClient } from "./src/generated/prisma";

const prisma = new PrismaClient();

async function testDatabase() {
    try {
        console.log("Testing database connection...\n");

        // Test 1: Check if we can connect
        console.log("1. Testing connection...");
        await prisma.$connect();
        console.log("✅ Connected successfully!\n");

        // Test 2: Count states
        console.log("2. Counting states in database...");
        const stateCount = await prisma.state.count();
        console.log(`✅ Found ${stateCount} states\n`);

        // Test 3: Count workers
        console.log("3. Counting workers in database...");
        const workerCount = await prisma.worker.count();
        console.log(`✅ Found ${workerCount} workers\n`);

        // Test 4: Count users
        console.log("4. Counting users in database...");
        const userCount = await prisma.user.count();
        console.log(`✅ Found ${userCount} users\n`);

        // Test 5: List some states
        if (stateCount > 0) {
            console.log("5. Listing first 5 states...");
            const states = await prisma.state.findMany({
                take: 5,
                select: { name: true, code: true }
            });
            states.forEach(state => {
                console.log(`   - ${state.name} (${state.code})`);
            });
            console.log("✅ Successfully retrieved states\n");
        }

        console.log("=================================");
        console.log("✅ DATABASE IS WORKING PROPERLY!");
        console.log("=================================");

    } catch (error) {
        console.error("❌ Database test failed:");
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();
