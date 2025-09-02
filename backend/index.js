// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

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

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully');
        release();
    }
});

// Routes
app.get('/', (req, res) => {
    res.json({ success: true, message: '✅ Backend API running...' });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username dan password wajib diisi" });
    }

    try {
        // Cari user berdasarkan username
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Username atau password salah" });
        }

        const user = result.rows[0];

        // Bandingkan password plain dengan hash di DB
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Username atau password salah" });
        }

        // Login sukses
        return res.json({
            success: true,
            message: "Login berhasil",
            token: "jwt-token-placeholder", // bisa diganti JWT beneran nanti
            role: user.role || "user",
            username: user.username,
            user: user
        });

    } catch (err) {
        console.error("❌ Error query login:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Accessible on: http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://192.168.1.101:${PORT}`);
});
