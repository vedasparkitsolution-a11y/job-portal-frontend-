const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool instead of a single connection
// This helps manage multiple concurrent requests efficiently
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job_portal_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Connected to the MySQL database.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error connecting to the MySQL database.');
        console.error(`Reason: ${err.code} - ${err.message}`);
        console.error('Please ensure your MySQL server is running and the credentials in .env are correct.');
    });

module.exports = pool;
