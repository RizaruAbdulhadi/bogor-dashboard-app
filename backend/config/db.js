const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dashboarddb',
    password: 'Abdulhadi',
    port: 5432,
});

module.exports = pool;
