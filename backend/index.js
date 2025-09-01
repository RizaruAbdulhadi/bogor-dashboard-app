// server.js - Simplified version
const express = require('express');
const app = express();
const PORT = 5000;

// Basic middleware
app.use(require('cors')());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!', success: true });
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Mock response for testing
    res.json({
        success: true,
        message: 'Login successful (mock)',
        token: 'mock-token',
        role: 'admin',
        username: username
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});