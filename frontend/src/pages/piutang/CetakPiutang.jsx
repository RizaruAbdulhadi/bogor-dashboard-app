import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoKF from '../../assets/kf.jpg';

const CetakPiutang = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [kwitansiData, setKwitansiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKwitansiData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/kwitansi/${id}`);
                setKwitansiData(response.data);
            } catch (err) {
                console.error('Gagal mengambil data kwitansi:', err);
                setError('Data tidak ditemukan atau server error');
            } finally {
                setLoading(false);
            }
        };

        fetchKwitansiData();
    }, [id]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const handlePrint = () => window.print();
    const handleBack = () => navigate('/lihat');

    if (loading) return <p className="text-center py-12">Memuat data...</p>;
    if (error) return <p className="text-center py-12 text-red-600">{error}</p>;
    if (!kwitansiData) return <p className="text-center py-12">Data tidak tersedia</p>;

    return (
        <div className="kwitansi-container">
            <div className="flex justify-between items-start mb-6 print:mb-4">
                <div className="flex-1">
                    <img
                        src={logoKF}
                        alt="Kimia Farma"
                        className="w-36 h-auto mb-2 print:w-32"
                        onError={(e) => (e.target.style.display = 'none')}
                    />
                    <div className="text-xs leading-tight">
                        <strong className="text-sm">Apotek</strong><br />
                        Unit Bisnis Bogor<br />
                        Jl. Ir. H. Juanda No.30<br />
                        Telp. 0251-8363473 Bogor
                    </div>
                </div>
                <div className="flex-1 text-right">
                    <h1 className="text-2xl font-bold mb-1 print:text-xl">KWITANSI</h1>
                    <div className="text-sm">
                        <p className="font-semibold">{kwitansiData.nomor_kwitansi}</p>
                        <p>No. Rek. {kwitansiData.rekening?.nomor || '-'}</p>
                        <p>{kwitansiData.rekening?.bank || '-'}</p>
                    </div>
                </div>
            </div>

            <table className="kwitansi-table w-full mb-6 print:mb-4">
                <tbody>
                <tr>
                    <td>Sudah terima dari</td>
                    <td className="font-bold uppercase underline">{kwitansiData.nama_penjamin || '-'}</td>
                </tr>
                <tr>
                    <td>Banyaknya Uang</td>
                    <td className="font-bold text-base">{kwitansiData.terbilang || '-'}</td>
                </tr>
                <tr>
                    <td>Untuk Pembayaran</td>
                    <td className="italic">{kwitansiData.keterangan || '-'}</td>
                </tr>
                </tbody>
            </table>

            <div className="text-left text-lg font-bold mb-8 print:mb-6 underline">
                {formatCurrency(kwitansiData.nominal)}
            </div>

            <div className="text-right">
                <div className="mb-2">Bogor, {formatDate(kwitansiData.tanggal)}</div>
                <div className="mt-16 mb-4">
                    <div className="border-t-2 border-black w-48 inline-block"></div>
                </div>
                <div className="font-bold uppercase">
                    {kwitansiData.pimpinan || '-'}
                </div>
            </div>

            <div className="mt-12 text-center print:hidden">
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg mr-4 transition"
                >
                    Cetak
                </button>
                <button
                    onClick={handleBack}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition"
                >
                    Kembali ke Data
                </button>
            </div>

            <style>{`
                .kwitansi-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: white;
                    font-family: Arial, sans-serif;
                    color: #000;
                }

                .kwitansi-table {
                    border-collapse: collapse;
                }

                .kwitansi-table td, .kwitansi-table th {
                    border: 1px solid #000 !important;
                    padding: 8px;
                    font-size: 14px;
                    vertical-align: top;
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 20mm 15mm;
                    }

                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color: #000 !important;
                    }

                    .print\\:hidden {
                        display: none !important;
                    }

                    .print\\:mb-4 {
                        margin-bottom: 1rem !important;
                    }

                    .print\\:text-xl {
                        font-size: 1.25rem !important;
                    }

                    .print\\:w-32 {
                        width: 8rem !important;
                    }

                    .kwitansi-container {
                        padding: 0 !important;
                        box-shadow: none !important;
                    }

                    .kwitansi-table td, .kwitansi-table th {
                        border: 1px solid #000 !important;
                        outline: 1px solid #000 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default CetakPiutang;
