// backend/config/db.js
const sql = require('mssql');

// Try with sa first
const config = {
    user: 'admin',                    // Your RDS master username
    password: 'unipro_hawker',    // Your RDS password
    server: 'mssql-onprem-db.ct2s4oesuriu.ap-southeast-2.rds.amazonaws.com',
    port: 1433,                         // Add port explicitly
    database: 'POSDatabase',
    options: {
        encrypt: true,                   // AWS RDS needs encryption
        trustServerCertificate: true,     // For self-signed cert
        enableArithAbort: true,
        connectTimeout: 30000             // 30 seconds timeout
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// If sa doesn't work, use posuser
// const config = {
//     user: 'posuser',
//     password: 'pos123',
//     server: 'localhost',
//     database: 'POSDatabase',
//     options: {
//         encrypt: false,
//         trustServerCertificate: true
//     }
// };

let pool = null;

const connectDB = async () => {
    try {
        console.log('🔄 Connecting to AWS RDS SQL Server...');
        console.log('📍 Server:', config.server);
        console.log('📍 Database:', config.database);
        console.log('📍 User:', config.user);
        
        pool = await sql.connect(config);
        console.log('✅ Connected to AWS RDS SQL Server');
        
        // Test query
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('📊 SQL Server Version:', result.recordset[0].version);
        
        return pool;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.error('📝 Details:', err);
        throw err;
    }
};

const getPool = () => {
    if (!pool) throw new Error('Database not connected');
    return pool;
};

module.exports = { connectDB, getPool, sql };