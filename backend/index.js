require('dotenv').config({ path: 'db.env' });
const express = require('express');
const cors = require('cors');
const path = require('path'); // 👈 tambahan
const app = express();

const authRoutes = require('./routes/authRoutes');
const rekeningRoutes = require('./routes/rekeningRoutes');
const { sequelize } = require('./models');
const pimpinanRoutes = require('./routes/pimpinanRoutes');
const debiturRoutes = require('./routes/debitur');
const outletRoutes = require('./routes/outletRoutes');
const kwitansiRoutes = require('./routes/kwitansiRoutes');
const fakturRoutes = require('./routes/statusFaktur');
const krediturRoutes = require('./routes/krediturRoutes');
const agingHDRoutes = require('./routes/agingHDRoutes');

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rekening', rekeningRoutes);
app.use('/api/pimpinan', pimpinanRoutes);
app.use('/api/debitur', debiturRoutes);
app.use('/api/outlet', outletRoutes);
app.use('/api/kwitansi', kwitansiRoutes);
app.use('/api/faktur', fakturRoutes);
app.use('/api/kreditur', krediturRoutes);
app.use('/api', agingHDRoutes);

// Serve React build 👇
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('Connected to database');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });
