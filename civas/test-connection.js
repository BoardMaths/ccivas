const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        const client = await pool.connect();
        console.log('✅ Successfully connected to database!');
        
        const result = await client.query('SELECT NOW()');
        console.log('✅ Query executed successfully');
        console.log('Server time:', result.rows[0].now);
        
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('\n📊 Tables in database:');
        tablesResult.rows.forEach(row => console.log('  -', row.table_name));
        
        client.release();
        await pool.end();
        console.log('\n✅ Database is working properly!');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.error('Full error:', error);
        await pool.end();
        process.exit(1);
    }
}

testConnection();
