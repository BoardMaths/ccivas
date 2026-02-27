
const dotenv = require('dotenv');
dotenv.config();
console.log("DB URL Check:", process.env.DATABASE_URL ? "Defined" : "Undefined");

const { PrismaClient } = require("./src/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

async function restoreAdmin() {
    console.log("Restoring Admin User...");
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const admins = [
            { email: "hassanolaitan2018@gmail.com", kindeId: "kp_894c0f03343b4803b60e8bdda15688bc", firstName: "Hassan", lastName: "Ridwan" },
            { email: "hridwanola@gmail.com", kindeId: "", firstName: "Hridwan", lastName: "Ola" }
        ];

        for (const admin of admins) {
            await prisma.user.upsert({
                where: { email: admin.email },
                update: {
                    role: "SUPERADMIN",
                    ...(admin.kindeId ? { kindeId: admin.kindeId } : {})
                },
                create: {
                    email: admin.email,
                    role: "SUPERADMIN",
                    kindeId: admin.kindeId || `pending_${admin.email}`,
                    firstName: admin.firstName,
                    lastName: admin.lastName
                }
            });
            console.log(`Admin user ${admin.email} restored/added as SUPERADMIN.`);
        }
    } catch (e) {
        console.error("Failed to restore admin:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreAdmin();
