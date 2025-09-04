const express = require("express");
const cors = require("cors");
const os = require("os");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");

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
