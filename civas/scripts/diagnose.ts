import { prisma } from "../src/lib/prisma";

async function diagnose() {
    console.log("--- DATABASE DIAGNOSTICS ---");

    try {
        const states = await prisma.state.findMany();
        console.log(`- State Count: ${states.length}`);
        if (states.length > 0) {
            console.log("- First 3 states:", states.slice(0, 3).map(s => s.name).join(", "));
        }

        const users = await prisma.user.findMany();
        console.log(`- User Count: ${users.length}`);
        users.forEach(u => {
            console.log(`  > User: ${u.email} | Role: ${u.role} | KindeID: ${u.kindeId}`);
        });

    } catch (error) {
        console.error("DIAGNOSTIC ERROR:", error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
