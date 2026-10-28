const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('❌ Error: DATABASE_URL is not set or still contains [YOUR-PASSWORD].');
    console.log('Please replace [YOUR-PASSWORD] with your actual Supabase database password in backend/.env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
});

async function runMigration() {
    console.log('⏳ Connecting to Supabase database...');
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Successfully connected to Supabase PostgreSQL!');

        const schemaSql = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf8');
        console.log('🚀 Running database schema creation...');
        
        await client.query(schemaSql);
        console.log('🎉 All tables and initial seeds have been successfully created in Supabase!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

runMigration();

