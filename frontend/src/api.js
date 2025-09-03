import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // ✅ pakai .env, bukan hardcode
});
console.log("🚀 API Base URL =", process.env.REACT_APP_API_URL);

// Interceptor untuk menambahkan token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
