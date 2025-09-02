import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // 🔧 Ambil API base URL dari .env
    const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://192.168.1.101:5000";

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        console.log("LoginPage: mulai proses login dengan username =", username);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            console.log("LoginPage: response status =", res.status);

            // Cek kalau bukan JSON valid
            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error("Response bukan JSON");
            }

            console.log("LoginPage: response body =", data);

            if (res.ok && data.success) {
                // Simpan ke localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("user", JSON.stringify(data.user));

                console.log("LoginPage: data disimpan ke localStorage");

                // Simpan ke AuthContext
                login({
                    username: data.username,
                    role: data.role,
                    userData: data.user,
                });

                // Redirect ke dashboard
                navigate("/dashboard", { replace: true });
            } else {
                setError(data.message || "Login gagal");
            }
        } catch (err) {
            console.error("LoginPage: error saat login =", err);
            setError(
                "Tidak bisa terhubung ke server. Pastikan backend jalan di " +
                API_BASE_URL
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
                    Bogor Dashboard Login
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
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
                            disabled={isLoading}
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
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition duration-300 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Login"}
                    </button>
                </form>

                <p className="mt-4 text-xs text-center text-gray-500">
                    Server: {API_BASE_URL}
                </p>
                <p className="mt-2 text-xs text-center text-gray-500">
                    © {new Date().getFullYear()} Bogor Dashboard. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
