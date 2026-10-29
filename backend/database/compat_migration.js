const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const migrations = [
  // Users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS ispremium INT DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS applicationcount INT DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS companyname VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS hrname VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,
  
  // Employers
  `ALTER TABLE employers ADD COLUMN IF NOT EXISTS userid INT;`,
  `ALTER TABLE employers ADD COLUMN IF NOT EXISTS companyid INT;`,
  `ALTER TABLE employers ADD COLUMN IF NOT EXISTS hrname VARCHAR(255);`,

  // Jobs
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS companyid INT;`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jobtype VARCHAR(100);`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS googleformlink TEXT;`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,

  // Applications
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS jobid VARCHAR(100);`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicantid VARCHAR(100);`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS companyid VARCHAR(100);`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS appliedat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,

  // Candidates
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS userid INT;`,

  // Subscriptions
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS userid INT;`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS companyid VARCHAR(100);`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS companyname VARCHAR(255);`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS employername VARCHAR(255);`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS useremail VARCHAR(255);`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS planid INT;`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS startdate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS enddate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,

  // Payments
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS useremail VARCHAR(255);`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS userid INT;`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS planid INT;`
];

async function runMigrations() {
  console.log('Running column compatibility migrations...');
  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (e) {
      console.warn('Migration warning:', e.message);
    }
  }
  console.log('All compatibility migrations completed successfully!');
  await pool.end();
}

runMigrations().catch(console.error);

