
const { Client } = require('pg');

async function dropAll() {
    const client = new Client({
        connectionString: "postgresql://postgres.ytgwjzmcqgfiuobtntcd:CivasDb2026%24Secure@aws-1-eu-west-2.pooler.supabase.com:5432/postgres",
    });
    try {
        await client.connect();
        console.log("Connected to Supabase session port...");

        // Drop all tables
        const tables = ['Activity', 'Document', 'Worker', 'State', 'User', '_prisma_migrations'];
        for (const table of tables) {
            console.log(`Dropping ${table}...`);
            await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }

        // Drop types
        console.log("Dropping Enum types...");
        await client.query('DROP TYPE IF EXISTS "DocumentType" CASCADE');
        await client.query('DROP TYPE IF EXISTS "Role" CASCADE');

        console.log("Database cleared successfully.");
        await client.end();
    } catch (err) {
        console.error("Drop failed:", err);
    }
}
dropAll();
