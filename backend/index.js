const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './db.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "dashboarddb",
    password: process.env.DB_PASSWORD || "Abdulhadi",
    port: process.env.DB_PORT || 5432,
});

// ✅ Middleware
app.use(cors({
    origin: "*" // bisa diperketat nanti (misalnya pakai whitelist)
}));
app.use(express.json());

// ✅ Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully');
        release();
    }
});

// ✅ Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '✅ Backend API running...',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username dan password wajib diisi" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Username atau password salah" });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: "Username atau password salah" });
        }

        return res.json({
            success: true,
            message: "Login berhasil",
            token: "jwt-token-placeholder", // nanti diganti JWT asli
            role: user.role || "user",
            username: user.username,
            user: user
        });

    } catch (err) {
        console.error("❌ Error query login:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// ✅ Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ✅ 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://${process.env.HOST || "localhost"}:${PORT}`);
    console.log(`📡 Accessible on: http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://${process.env.NETWORK_IP || "192.168.1.101"}:${PORT}`);
    console.log(`🔧 CORS enabled for all origins`);
});
