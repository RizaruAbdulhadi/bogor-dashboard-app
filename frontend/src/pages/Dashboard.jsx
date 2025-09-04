import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";

function Dashboard() {
    const { user } = useContext(AuthContext);

    if (!user) {
        return (
            <div className="text-center mt-20 text-red-500 font-bold">
                Akses ditolak. Silakan login terlebih dahulu.
            </div>
        );
    }

    return (
        <MainLayout>
            <h1 className="text-3xl font-bold mb-4">Selamat datang, {user.username}!</h1>
            <p className="text-lg text-gray-700">
                Role: <span className="font-semibold">{user.role}</span>
            </p>

            <div className="mt-6 bg-white p-6 rounded shadow-md">
                <h2 className="text-xl font-semibold mb-2">Dashboard Utama</h2>
                <p>Ini adalah halaman setelah login. Anda bisa mengembangkan fitur di sini.</p>
            </div>
        </MainLayout>
    );
}

export default Dashboard;
