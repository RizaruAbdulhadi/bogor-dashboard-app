const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const rekeningRoutes = require('./routes/rekeningRoutes');
const pimpinanRoutes = require('./routes/pimpinanRoutes');
const debiturRoutes = require('./routes/debitur');
const outletRoutes = require('./routes/outletRoutes');
const kwitansiRoutes = require('./routes/kwitansi');

require('dotenv').config();
const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/rekening', rekeningRoutes);
app.use('/api/pimpinan', pimpinanRoutes);
app.use('/api/debitur', debiturRoutes);
app.use('/api/outlet', outletRoutes);
app.use('/api/kwitansi', kwitansiRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
});

module.exports = app;
