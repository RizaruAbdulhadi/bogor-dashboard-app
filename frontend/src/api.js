import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: `${API_URL}/api`, // ✅ otomatis pakai /api
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
