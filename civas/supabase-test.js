
const { Client } = require('pg');

async function test() {
    const client = new Client({
        connectionString: "postgresql://postgres.ytgwjzmcqgfiuobtntcd:CivasDb2026%24Secure@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
        ssl: false // Supabase pgbouncer doesn't like SSL sometimes or handles it differently
    });
    try {
        console.log("Connecting to Supabase...");
        await client.connect();
        console.log("Connected to Supabase!");
        const res = await client.query('SELECT NOW()');
        console.log("Time:", res.rows[0]);
        await client.end();
    } catch (err) {
        console.error("Supabase Connection failed:", err);
    }
}
test();
