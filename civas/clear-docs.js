
const { Client } = require('pg');
require('dotenv').config();

async function clear() {
    const client = new Client({
        connectionString: "postgresql://postgres.ytgwjzmcqgfiuobtntcd:CivasDb2026%24Secure@aws-1-eu-west-2.pooler.supabase.com:5432/postgres",
    });
    try {
        await client.connect();
        console.log("Connected to Supabase.");
        console.log("Cleaning up Document table...");
        await client.query('DELETE FROM "Document"');
        console.log("Cleanup complete.");
        await client.end();
    } catch (err) {
        console.error("Failed:", err);
    }
}
clear();
