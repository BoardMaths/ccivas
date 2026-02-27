import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function setupAdmin() {
    console.log("👤 Setting up SUPERADMIN user...");

    const email = "hridwanola@gmail.com";

    // We don't have the Kinde ID yet if the user hasn't successfully logged in.
    // However, we can create the user with the email and update the Kinde ID later
    // OR if we know the Kinde ID from the logs/console we could use it.
    // For now, we'll ensure a user with this email exists and has the role.

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: "SUPERADMIN",
                // If the user exists, we don't want to overwrite other fields blindly
            },
            create: {
                email,
                kindeId: "kp_" + Date.now(), // Temporary ID, will be updated on first login by route.ts
                firstName: "Hassan",
                lastName: "Ridwan",
                role: "SUPERADMIN"
            }
        });

        console.log("✅ User setup successful:");
        console.log(`   Email: ${user.email}`);
        console.log(`   Role:  ${user.role}`);
        console.log(`   ID:    ${user.id}`);

    } catch (error) {
        console.error("❌ Failed to setup user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAdmin();
