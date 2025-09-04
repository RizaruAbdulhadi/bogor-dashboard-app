import React, { useEffect, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../api'; // ✅ gunakan axios instance

function MasterBank() {
    const [banks, setBanks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ id: '', bank: '', nomor: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            const res = await api.get('/rekening'); // ✅ tidak hardcode
            setBanks(res.data);
        } catch (err) {
            setError('Gagal memuat data bank');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rekening', form); // ✅ tidak hardcode
            setForm({ id: '', bank: '', nomor: '' });
            setShowModal(false);
            fetchBanks();
        } catch (err) {
            console.error('❌ Error saat menambah bank:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Gagal menambahkan bank');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus bank ini?')) return;

        try {
            await api.delete(`/rekening/${id}`); // ✅ tidak hardcode
            // Refresh data setelah delete
            setBanks(banks.filter(bank => bank.id !== id));
        } catch (error) {
            console.error('❌ Gagal menghapus bank:', error);
            alert('Gagal menghapus bank');
        }
    };

    return (
        <MainLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Master Bank</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Tambah Bank
                    </button>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="border px-4 py-2">Bank</th>
                        <th className="border px-4 py-2">Nomor</th>
                        <th className="border px-4 py-2">Aksi</th>
                    </tr>
                    </thead>
                    <tbody>
                    {banks.map((bank) => (
                        <tr key={bank.id}>
                            <td className="border px-4 py-2">{bank.bank}</td>
                            <td className="border px-4 py-2">{bank.nomor}</td>
                            <td className="border px-4 py-2">
                                <button
                                    onClick={() => handleDelete(bank.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Modal Input Bank */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded shadow w-96">
                            <h2 className="text-xl font-semibold mb-4">Input Master Bank</h2>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    placeholder="Nama Bank"
                                    value={form.bank}
                                    onChange={(e) => setForm({ ...form, bank: e.target.value })}
                                    className="w-full p-2 border rounded mb-3"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nomor Rekening"
                                    value={form.nomor}
                                    onChange={(e) => setForm({ ...form, nomor: e.target.value })}
                                    className="w-full p-2 border rounded mb-3"
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-500 rounded"
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

export default MasterBank;
