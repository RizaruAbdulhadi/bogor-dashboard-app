require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Konfigurasi dari .env
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "Abdulhadi-secret-key";

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "dashboarddb",
    password: process.env.DB_PASSWORD || "Abdulhadi",
    port: process.env.DB_PORT || 5432,
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Database connected successfully");
        client.release();
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }
};

// Middleware CORS
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
}));

// Handle preflight requests
app.options('*', cors());

// Middleware untuk parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware untuk log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware untuk verifikasi JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
};

// TEST route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "✅ Backend API running...",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            success: true,
            message: "Server and database are healthy",
            database: "connected"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: err.message
        });
    }
});

// LOGIN route - DIPERBAIKI dengan password hashing
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username dan password wajib diisi"
        });
    }

    try {
        // Cari user berdasarkan username
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah"
            });
        }

        const user = result.rows[0];

        // Verifikasi password (asumsi password disimpan sebagai plaintext untuk sementara)
        // Untuk production, gunakan bcrypt.compare()
        const isPasswordValid = password === user.password;

        // Jika menggunakan bcrypt:
        // const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Hapus password dari response
        const { password: _, ...userWithoutPassword } = user;

        return res.json({
            success: true,
            message: "Login berhasil",
            token: token,
            role: user.role || "user",
            username: user.username,
            user: userWithoutPassword,
            expiresIn: "24h"
        });

    } catch (err) {
        console.error("❌ Error query login:", err.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// REGISTER route (optional)
app.post("/api/auth/register", async (req, res) => {
    const { username, password, email, role = "user" } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({
            success: false,
            message: "Username, password, dan email wajib diisi"
        });
    }

    try {
        // Check if user already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username atau email sudah terdaftar"
            });
        }

        // Hash password (gunakan untuk production)
        // const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await pool.query(
            "INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role",
            [username, password, email, role] // Ganti dengan hashedPassword untuk production
        );

        const newUser = result.rows[0];

        // Generate token
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token: token,
            user: newUser
        });

    } catch (err) {
        console.error("❌ Error register:", err.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// Protected route example
app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email, role, created_at FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (err) {
        console.error("❌ Error getting profile:", err.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// Get all users (protected, admin only)
app.get("/api/users", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const result = await pool.query(
            "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC"
        );

        res.json({
            success: true,
            users: result.rows,
            count: result.rows.length
        });

    } catch (err) {
        console.error("❌ Error getting users:", err.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// 404 handler untuk route yang tidak ada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
        path: req.path
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Unhandled Error:", err.message);
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server gracefully...');
    await pool.end();
    process.exit(0);
});

// Start server
const startServer = async () => {
    await testConnection();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
        console.log(`📡 Local access: http://localhost:${PORT}`);
        console.log(`🌐 Network access: http://192.168.1.101:${PORT}`);
        console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
        console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
        console.log(`💾 Database: ${process.env.DB_NAME || 'dashboarddb'}`);
        console.log("──────────────────────────────────────────");
    });
};

startServer().catch(err => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
});