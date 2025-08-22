import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';

function MasterOutlet() {
    const [outlet, setOutlet] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ id: '', kode: '', nama_outlet: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOutlet();
    }, []);

    const fetchOutlet = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/outlet');
            setOutlet(res.data);
        } catch (err) {
            setError('Gagal memuat data outlet');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/outlet', form);
            setForm({ id: '', kode: '', nama_outlet: '' });
            setShowModal(false);
            fetchOutlet();
        } catch (err) {
            console.error('❌ Error saat menambah outlet:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Gagal menambahkan outlet');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus outlet ini?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/outlet/${id}`);
            // Refresh data setelah delete
            setOutlet(outlet.filter(outlet => outlet.id !== id));
        } catch (error) {
            console.error('❌ Gagal menghapus outlet:', error);
            alert('Gagal menghapus outlet');
        }
    };


    return (


        <MainLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Master Outlet</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Tambah Outlet
                    </button>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-200">

                    <tr>
                        <th className="border px-4 py-2">Kode</th>
                        <th className="border px-4 py-2">Nama Outlet</th>
                        <th className="border px-4 py-2">Aksi</th>
                    </tr>
                    </thead>
                    <tbody>
                    {outlet.map((outlet) => (
                        <tr key={outlet.id}>
                            <td className="border px-4 py-2">{outlet.kode}</td>
                            <td className="border px-4 py-2">{outlet.nama_outlet}</td>
                            <td className="border px-4 py-2">
                                <button
                                    onClick={() => handleDelete(outlet.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Modal Input Outlet */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded shadow w-96">
                            <h2 className="text-xl font-semibold mb-4">Input Master Outlet</h2>
                            <form onSubmit={handleSubmit}>

                                <input
                                    type="text"
                                    placeholder="Kode"
                                    value={form.kode}
                                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                                    className="w-full p-2 border rounded mb-3"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nama Outlet"
                                    value={form.nama_outlet}
                                    onChange={(e) => setForm({ ...form, nama_outlet: e.target.value })}
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

export default MasterOutlet;
