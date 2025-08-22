const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config({ path: 'db.env' });

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt:', username);
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: 'User tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
