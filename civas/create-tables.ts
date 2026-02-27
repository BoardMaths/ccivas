import { Pool } from "pg";
import "dotenv/config";

async function createTables() {
    console.log("🔨 Creating Database Tables...\n");
    
    const dbUrl = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: false, // pgbouncer doesn't support SSL
    });

    try {
        const client = await pool.connect();
        console.log("✅ Connected to database\n");
        
        // Create tables based on Prisma schema
        console.log("Creating tables...");
        
        await client.query(`
            -- Create enum types
            CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');
            CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'QUALIFICATION', 'CONTRACT', 'REPORT', 'OTHER');
        `);
        console.log("  ✓ Created enum types");
        
        await client.query(`
            -- Create User table
            CREATE TABLE "User" (
                "id" TEXT PRIMARY KEY,
                "kindeId" TEXT UNIQUE NOT NULL,
                "email" TEXT UNIQUE NOT NULL,
                "firstName" TEXT,
                "lastName" TEXT,
                "role" "Role" NOT NULL DEFAULT 'USER',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL
            );
        `);
        console.log("  ✓ Created User table");
        
        await client.query(`
            -- Create State table
            CREATE TABLE "State" (
                "id" TEXT PRIMARY KEY,
                "name" TEXT UNIQUE NOT NULL,
                "code" TEXT UNIQUE NOT NULL
            );
            CREATE INDEX "State_name_idx" ON "State"("name");
        `);
        console.log("  ✓ Created State table");
        
        await client.query(`
            -- Create Worker table
            CREATE TABLE "Worker" (
                "id" TEXT PRIMARY KEY,
                "staffId" TEXT UNIQUE NOT NULL,
                "firstName" TEXT,
                "lastName" TEXT,
                "fullName" TEXT,
                "imageUrl" TEXT,
                "email" TEXT,
                "phone" TEXT,
                "dob" TIMESTAMP(3),
                "stateId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Worker_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE
            );
            CREATE INDEX "Worker_stateId_idx" ON "Worker"("stateId");
        `);
        console.log("  ✓ Created Worker table");
        
        await client.query(`
            -- Create Activity table
            CREATE TABLE "Activity" (
                "id" TEXT PRIMARY KEY,
                "title" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "stateId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Activity_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE
            );
            CREATE INDEX "Activity_stateId_idx" ON "Activity"("stateId");
        `);
        console.log("  ✓ Created Activity table");
        
        client.release();
        await pool.end();
        
        console.log("\n✅ All tables created successfully!");
        console.log("\n💡 Next step: Run 'npx tsx check-db.ts' to verify");
        
    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        if (error.message.includes("already exists")) {
            console.log("\n⚠️  Tables may already exist. Run 'npx tsx check-db.ts' to verify.");
        }
        await pool.end();
        process.exit(1);
    }
}

createTables();
