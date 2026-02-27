
const { Client } = require('pg');
require('dotenv').config();

async function test() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log("Connected!");
        const res = await client.query('SELECT NOW()');
        console.log("Time:", res.rows[0]);
        await client.end();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}
test();
