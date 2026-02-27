import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestUser() {
    console.log("Creating test user...");

    try {
        // Create a test admin user
        const testUser = await prisma.user.upsert({
            where: { email: "admin@civas.com" },
            update: {},
            create: {
                kindeId: "pending", // Will be updated after first Kinde login
                email: "admin@civas.com",
                firstName: "Test",
                lastName: "Admin",
                role: "ADMIN",
            }
        });

        console.log("✅ Test user created successfully!");
        console.log("Email: admin@civas.com");
        console.log("Role: ADMIN");
        console.log("\nYou can now use this email to test the login flow.");

    } catch (error) {
        console.error("Error creating test user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
