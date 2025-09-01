import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // 🔑 Tentukan base URL untuk API
    const API_BASE_URL =
        process.env.REACT_APP_API_URL || "/api";
    // kalau di-dev, set REACT_APP_API_URL=http://localhost:5000
    // kalau di-prod (pakai nginx), otomatis "/api"

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        console.log("LoginPage: mulai proses login dengan username =", username);

        try {
            const res = await fetch("http://192.168.1.101:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            console.log("LoginPage: response status =", res.status);

            const data = await res.json();
            console.log("LoginPage: response body =", data);

            if (res.ok) {
                // Simpan token & role ke localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                console.log("LoginPage: token & role disimpan ke localStorage");

                login({ username: data.username, role: data.role });
                console.log("LoginPage: context login() dipanggil");

                navigate("/dashboard", { replace: true });
            } else {
                console.warn("LoginPage: login gagal dengan pesan =", data.message);
                setError(data.message || "Login gagal");
            }
        } catch (err) {
            console.error("LoginPage: error saat login =", err);
            setError("Network error. Pastikan backend berjalan.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
                    Bogor Dashboard Login
                </h2>
                {error && (
                    <div className="text-red-600 text-sm text-center mb-4">{error}</div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Username</label>
                        <input
                            type="text"
                            className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition duration-300"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-4 text-xs text-center text-gray-500">
                    © {new Date().getFullYear()} Bogor Dashboard. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
