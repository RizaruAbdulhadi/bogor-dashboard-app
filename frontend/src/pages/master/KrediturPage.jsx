import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';

function KrediturPage() {
    const [krediturList, setKrediturList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [nama_kreditur, setNamaKreditur] = useState('');
    const [kode_kreditur, setKodeKreditur] = useState('');
    const [jenis, setJenis] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // ✅ gunakan variabel env, bukan hardcode localhost
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    useEffect(() => {
        fetchKreditur();
    }, []);

    useEffect(() => {
        if (searchTerm.length >= 3) {
            const filtered = krediturList.filter(item =>
                item.nama_kreditur.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredList(filtered);
        } else {
            setFilteredList(krediturList);
        }
    }, [searchTerm, krediturList]);

    const fetchKreditur = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/kreditur`);
            setKrediturList(res.data);
            setFilteredList(res.data);
        } catch (err) {
            console.error("❌ Gagal fetch kreditur:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/kreditur`, { kode_kreditur, nama_kreditur, jenis });
            setKodeKreditur('');
            setNamaKreditur('');
            setJenis('');
            setShowModal(false);
            fetchKreditur();
        } catch (err) {
            console.error('❌ Gagal menambah kreditur:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus kreditur ini?')) return;
        try {
            await axios.delete(`${API_URL}/api/kreditur/${id}`);
            fetchKreditur();
        } catch (err) {
            console.error("❌ Gagal hapus kreditur:", err);
        }
    };

    return (
        <MainLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Master Kreditur</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
                    >
                        Tambah Kreditur
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Cari nama kreditur (min 3 huruf)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-1/3 mb-4 px-3 py-2 border rounded"
                />

                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="border px-4 py-2">Kode Kreditur</th>
                        <th className="border px-4 py-2">Nama Kreditur</th>
                        <th className="border px-4 py-2">Jenis</th>
                        <th className="border px-4 py-2">Aksi</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredList.length > 0 ? (
                        filteredList.map((item) => (
                            <tr key={item.id} className="border-t">
                                <td className="border px-4 py-2">{item.kode_kreditur}</td>
                                <td className="border px-4 py-2">{item.nama_kreditur}</td>
                                <td className="border px-4 py-2">{item.jenis}</td>
                                <td className="border px-4 py-2 text-center">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded"
                                    >
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center py-4 text-gray-500">
                                {searchTerm.length < 3
                                    ? 'Masukkan minimal 3 huruf untuk mencari.'
                                    : 'Tidak ada data ditemukan.'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                {/* Modal Input */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-10">
                        <div className="bg-white p-6 rounded shadow-lg w-96">
                            <h2 className="text-xl font-bold mb-4">Tambah Kreditur</h2>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    placeholder="Kode Kreditur"
                                    value={kode_kreditur}
                                    onChange={(e) => setKodeKreditur(e.target.value)}
                                    required
                                    className="w-full mb-4 p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Nama Kreditur"
                                    value={nama_kreditur}
                                    onChange={(e) => setNamaKreditur(e.target.value)}
                                    required
                                    className="w-full mb-4 p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Pihak 3 / BUMN / Afiliasi / Konsinyasi"
                                    value={jenis}
                                    onChange={(e) => setJenis(e.target.value)}
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

export default KrediturPage;
