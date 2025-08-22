require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'Abdulhadi',
        database: process.env.DB_NAME || 'dashboarddb',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    },
    test: {
        // ... (konfigurasi untuk environment test)
    },
    production: {
        // ... (konfigurasi untuk production)
    }
};