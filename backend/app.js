const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const rekeningRoutes = require('./routes/rekeningRoutes');
const pimpinanRoutes = require('./routes/pimpinanRoutes');
const debiturRoutes = require('./routes/debitur');
const outletRoutes = require('./routes/outletRoutes');
const kwitansiRoutes = require('./routes/kwitansiRoutes');
const fakturRoutes = require('./routes/statusFaktur');
const krediturRoutes = require('./routes/krediturRoutes');
const agingHDRoutes = require('./routes/agingHDRoutes');
const detailBeliRoutes = require('./routes/detailBeli');

const app = express();

// 🔑 Konfigurasi CORS: izinkan localhost:3000 (dev) & 192.168.1.101:8080 (LAN via nginx)
app.use(cors({
    origin: [
        "http://localhost:3000",         // React dev
        "http://192.168.1.101:8080"      // React build via Nginx
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.use('/api/faktur', fakturRoutes);
app.use('/api/kreditur', krediturRoutes);
app.use('/api', agingHDRoutes);
app.use('/api/detailbeli', detailBeliRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
});

module.exports = app;
