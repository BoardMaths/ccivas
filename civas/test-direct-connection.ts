import { Pool } from "pg";
import "dotenv/config";

async function testDirectConnection() {
    console.log("=== DIRECT DATABASE CONNECTION TEST ===\n");

    const dbUrl = process.env.DATABASE_URL;
    console.log("DATABASE_URL found:", !!dbUrl);
    console.log("Contains pgbouncer:", dbUrl?.includes("pgbouncer=true"));
    console.log("Connection string (masked):", dbUrl?.replace(/:[^:@]+@/, ":****@"));

    const isPgBouncer = dbUrl?.includes("pgbouncer=true");
    console.log("\nSSL Configuration:", isPgBouncer ? "DISABLED (pgbouncer)" : "ENABLED");

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: isPgBouncer ? false : { rejectUnauthorized: false },
    });

    try {
        const client = await pool.connect();
        console.log("\n✅ Successfully connected to database!");

        const result = await client.query("SELECT NOW() as current_time");
        console.log("✅ Query executed successfully");
        console.log("Server time:", result.rows[0].current_time);

        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log("\n📊 Tables in database:");
        tablesResult.rows.forEach(row => console.log("  -", row.table_name));

        const stateCount = await client.query("SELECT COUNT(*) as count FROM \"State\"");
        console.log("\n📈 State count:", stateCount.rows[0].count);

        const userCount = await client.query("SELECT COUNT(*) as count FROM \"User\"");
        console.log("📈 User count:", userCount.rows[0].count);

        client.release();
        await pool.end();

        console.log("\n✅ DATABASE IS WORKING PROPERLY!");
    } catch (error: any) {
        console.error("\n❌ Database connection error:", error.message);
        await pool.end();
        process.exit(1);
    }
}

testDirectConnection();
