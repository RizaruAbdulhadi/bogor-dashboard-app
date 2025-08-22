import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';

function DebiturPage() {
    const [debiturList, setDebiturList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [nama_debitur, setNama_Debitur] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchDebitur();
    }, []);

    useEffect(() => {
        if (searchTerm.length >= 3) {
            const filtered = debiturList.filter(item =>
                item.nama_debitur.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredList(filtered);
        } else {
            setFilteredList(debiturList);
        }
    }, [searchTerm, debiturList]);

    const fetchDebitur = async () => {
        const res = await axios.get('http://localhost:5000/api/debitur');
        setDebiturList(res.data);
        setFilteredList(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/debitur', { nama_debitur });
            setNama_Debitur('');
            setShowModal(false);
            fetchDebitur();
        } catch (err) {
            console.error('❌ Gagal menambah debitur:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus debitur ini?')) return;
        await axios.delete(`http://localhost:5000/api/debitur/${id}`);
        fetchDebitur();
    };

    return (
        <MainLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Master Debitur</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
                    >
                        Tambah Debitur
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Cari nama debitur (min 3 huruf)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-1/3 mb-4 px-3 py-2 border rounded"
                />

                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="border px-4 py-2">Nama Debitur</th>
                        <th className="border px-4 py-2">Aksi</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredList.length > 0 ? (
                        filteredList.map((item) => (
                            <tr key={item.id} className="border-t">
                                <td className="border px-4 py-2">{item.nama_debitur}</td>
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
                            <td colSpan="2" className="text-center py-4 text-gray-500">
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
                            <h2 className="text-xl font-bold mb-4">Tambah Debitur</h2>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    placeholder="Nama Debitur"
                                    value={nama_debitur}
                                    onChange={(e) => setNama_Debitur(e.target.value)}
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

export default DebiturPage;
