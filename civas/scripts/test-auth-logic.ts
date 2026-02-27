import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function testAuthLogic() {
    console.log("🧪 Testing Auth Logic simulation...");

    // Simulate Kinde user
    const mockUser = {
        id: "kp_test_user_123",
        email: "test@example.com",
        given_name: "Test",
        family_name: "User"
    };

    console.log("Mock User:", mockUser);

    try {
        console.log("1. Looking up user...");
        let dbUser = await prisma.user.findFirst({
            where: {
                OR: [{ kindeId: mockUser.id }, { email: mockUser.email }],
                role: {
                    in: ["USER", "ADMIN", "SUPERADMIN"],
                },
            },
        });

        console.log("Lookup result:", dbUser ? "Found" : "Not Found");

        if (dbUser && (dbUser.kindeId !== mockUser.id || dbUser.email !== mockUser.email)) {
            console.log("2. Updating user...");
            dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { kindeId: mockUser.id, email: mockUser.email },
            });
            console.log("User updated");
        }

        if (!dbUser) {
            console.log("3. Creating new user...");
            dbUser = await prisma.user.create({
                data: {
                    kindeId: mockUser.id,
                    email: mockUser.email,
                    firstName: mockUser.given_name,
                    lastName: mockUser.family_name,
                    role: "USER",
                },
            });
            console.log("User created successfully:", dbUser.id);
        } else {
            console.log("User already exists:", dbUser.id);
        }

        console.log("✅ Auth logic simulation passed!");
    } catch (error) {
        console.error("❌ Auth logic failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testAuthLogic();
