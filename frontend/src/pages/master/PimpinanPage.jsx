import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import api from "../../api";

function PimpinanPage() {
    const [pimpinanList, setPimpinanList] = useState([]);
    const [nama, setNama] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPimpinan();
    }, []);

    const fetchPimpinan = async () => {
        try {
            const res = await api.get("/pimpinan"); // ✅ otomatis ke REACT_APP_API_URL/pimpinan
            setPimpinanList(res.data);
        } catch (err) {
            console.error("❌ Gagal fetch pimpinan:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/pimpinan", { nama }); // ✅ otomatis ikut REACT_APP_API_URL
            setNama("");
            setShowModal(false);
            fetchPimpinan();
        } catch (err) {
            console.error("❌ Gagal menambah pimpinan:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus pimpinan ini?")) return;
        try {
            await api.delete(`/pimpinan/${id}`); // ✅ otomatis ikut REACT_APP_API_URL
            fetchPimpinan();
        } catch (err) {
            console.error("❌ Gagal hapus pimpinan:", err);
        }
    };


    return (
        <MainLayout>
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Master Pimpinan</h1>

            <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
            >
                Tambah Pimpinan
            </button>
            </div>



            <table className="w-full border border-gray-300">
                <thead className="bg-gray-200">
                <tr>
                    <th className="border px-4 py-2">Nama</th>
                    <th className="border px-4 py-2">Aksi</th>
                </tr>
                </thead>
                <tbody>
                {pimpinanList.map((item) => (
                    <tr key={item.id} className="border-t">
                        <td className="border px-4 py-2">{item.nama}</td>
                        <td className="border px-4 py-2 text-center">
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded"
                            >
                                Hapus
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Modal Input */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-10">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Tambah Pimpinan</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Nama Pimpinan"
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                required
                                className="w-full mb-4 p-2 border rounded"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 px-4 py-2 rounded"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </MainLayout>
    );
}

export default PimpinanPage;
