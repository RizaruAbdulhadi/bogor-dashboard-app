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
const statusFakturRoutes = require('./routes/statusFaktur');

require("dotenv").config({ path: "db.env" });

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// ✅ Middleware
app.use(cors({ origin: "*" }));
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
app.use('/api/faktur', statusFakturRoutes);
app.use('/api/faktur/uploads', statusFakturRoutes);
app.use('/api/aging-hd', statusFakturRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// ✅ Start server after DB connected
sequelize.authenticate()
    .then(() => {
        console.log("✅ Database connected successfully");
        return sequelize.sync();
    })
    .then(() => {
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
    })
    .catch(err => {
        console.error("❌ Database connection failed:", err.message);
    });
