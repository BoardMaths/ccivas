import { Pool } from "pg";
import "dotenv/config";

async function checkDatabase() {
    console.log("🔍 Checking Database Status...\n");

    const dbUrl = process.env.DATABASE_URL;
    const isPgBouncer = dbUrl?.includes("pgbouncer=true");

    console.log("📋 Configuration:");
    console.log("  - Using pgbouncer:", isPgBouncer ? "Yes" : "No");
    console.log("  - SSL:", isPgBouncer ? "Disabled" : "Enabled\n");

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: isPgBouncer ? false : { rejectUnauthorized: false },
    });

    try {
        // Test connection
        const client = await pool.connect();
        console.log("✅ Database connection successful!\n");

        // Check if tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log("📊 Database Tables:");
        if (tablesResult.rows.length === 0) {
            console.log("  ⚠️  No tables found - database needs to be initialized\n");
            console.log("💡 Next step: Run 'npm run prisma:push' to create tables");
        } else {
            tablesResult.rows.forEach(row => console.log("  ✓", row.table_name));

            // Count records in each table
            console.log("\n📈 Record Counts:");
            for (const row of tablesResult.rows) {
                try {
                    const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
                    console.log(`  - ${row.table_name}: ${countResult.rows[0].count} records`);
                } catch (err: any) {
                    console.log(`  - ${row.table_name}: Error counting (${err.message})`);
                }
            }
        }

        client.release();
        await pool.end();

        console.log("\n✅ Database check complete!");

    } catch (error: any) {
        console.error("\n❌ Database Error:", error.message);
        await pool.end();
        process.exit(1);
    }
}

checkDatabase();
