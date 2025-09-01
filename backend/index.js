// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "dashboarddb",
    password: process.env.DB_PASS || "Abdulhadi",
    port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors({
    origin: "http://localhost:3000", // alamat frontend React
    credentials: true
}));
app.use(bodyParser.json());

// TEST route
app.get("/", (req, res) => {
    res.send("Backend API running...");
});

// LOGIN route
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username dan password wajib diisi" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, message: "Login berhasil", user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Username atau password salah" });
        }
    } catch (err) {
        console.error("Error query login:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
