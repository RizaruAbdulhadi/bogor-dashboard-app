const express = require("express");
const cors = require("cors");
const os = require("os");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const rekeningRoutes = require('./routes/rekeningRoutes');
const pimpinanRoutes = require('./routes/pimpinanRoutes');
const debiturRoutes = require('./routes/debitur');
const outletRoutes = require('./routes/outletRoutes');
const krediturRoutes = require('./routes/krediturRoutes');
const kwitansiRoutes = require('./routes/kwitansiRoutes');
const fakturRoutes = require('./routes/statusFaktur');
const agingHDRoutes = require('./routes/agingHDRoutes');
const detailBeliRoutes = require('./routes/detailBeli');

require("dotenv").config({ path: "db.env" });

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

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

// ✅ Routes
app.get("/", (req, res) => {
    res.json({ success: true, message: "Backend API running..." });
});

app.use("/api/auth", authRoutes);
app.use('/api/rekening', rekeningRoutes);
app.use('/api/pimpinan', pimpinanRoutes);
app.use('/api/debitur', debiturRoutes);
app.use('/api/outlet', outletRoutes);
app.use('/api/kreditur', krediturRoutes);
app.use('/api/kwitansi', kwitansiRoutes);
app.use('/api/faktur', fakturRoutes);
app.use('/api/aging-hd', agingHDRoutes);
app.use('/api/detailbeli', detailBeliRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
});

// ✅ Start server after DB connected
async function startServer() {
    try {
        // Test database connection saja, tanpa sync
        await sequelize.authenticate();
        console.log("✅ Database connected successfully");
        console.log("ℹ️  Skipping database sync (tables already exist)");

        // Start server
        app.listen(PORT, HOST, () => {
            const nets = os.networkInterfaces();
            const results = [];
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    if (net.family === "IPv4" && !net.internal) {
                        results.push(net.address);
                    }
                }
            }
            console.log(`🚀 Server running on http://${HOST}:${PORT}`);
            console.log(`📡 Accessible locally on: http://localhost:${PORT}`);
            results.forEach(ip => {
                console.log(`🌐 Accessible on network: http://${ip}:${PORT}`);
            });
        });
    } catch (err) {
        console.error("❌ Startup failed:", err.message);
        console.error("Error details:", err);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        await sequelize.close();
        console.log('✅ Database connection closed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});

// Start the application
startServer();