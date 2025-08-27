const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models"); // Sequelize model
require("dotenv").config({ path: "db.env" });

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("Login attempt:", username);

        // Cari user di database
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: "User tidak ditemukan" });
        }

        // Validasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah" });
        }

        // Pastikan JWT_SECRET tersedia
        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET belum diset di .env");
            return res.status(500).json({ message: "Konfigurasi server error" });
        }

        // Buat JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Kirim response ke frontend
        res.json({
            token,
            role: user.role,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
