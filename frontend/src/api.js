import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.101:5000/api',
});

// Interceptor untuk menambahkan token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;