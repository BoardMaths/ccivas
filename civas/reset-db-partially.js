
const { Client } = require('pg');
require('dotenv').config();

async function reset() {
    const client = new Client({
        connectionString: "postgresql://postgres.ytgwjzmcqgfiuobtntcd:CivasDb2026%24Secure@aws-1-eu-west-2.pooler.supabase.com:5432/postgres",
    });
    try {
        await client.connect();
        console.log("Connected.");
        console.log("Dropping Document table and DocumentType enum...");
        await client.query('DROP TABLE IF EXISTS "Document" CASCADE');
        await client.query('DROP TYPE IF EXISTS "DocumentType" CASCADE');
        console.log("Reset complete.");
        await client.end();
    } catch (err) {
        console.error("Failed:", err);
    }
}
reset();
