const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("Login attempt:", username);

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ success: false, message: "User tidak ditemukan" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Password salah" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            message: "Login berhasil",
            token,
            role: user.role,
            username: user.username,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
