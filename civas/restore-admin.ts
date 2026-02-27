
import { prisma } from "./src/lib/prisma";

async function restoreAdmin() {
    console.log("Restoring Admin User...");
    try {
        await prisma.user.upsert({
            where: { email: "hridwanola@gmail.com" },
            update: {
                role: "SUPERADMIN",
                kindeId: "kp_894c0f03343b4803b60e8bdda15688bc"
            },
            create: {
                email: "hridwanola@gmail.com",
                role: "SUPERADMIN",
                kindeId: "kp_894c0f03343b4803b60e8bdda15688bc",
                firstName: "Hassan",
                lastName: "Ridwan"
            }
        });
        console.log("Admin user restored as SUPERADMIN.");
    } catch (e) {
        console.error("Failed to restore admin:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreAdmin();
