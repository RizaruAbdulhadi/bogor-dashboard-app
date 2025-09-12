import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../../layouts/MainLayout";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    const tgl = new Date(tanggal);
    return isNaN(tgl) ? "-" : tgl.toLocaleDateString("id-ID");
};

const formatAngka = (angka) => {
    if (!angka || isNaN(angka)) return "0";
    return parseFloat(angka).toLocaleString("id-ID");
};

const MonitoringBeli = () => {
    const [dataFaktur, setDataFaktur] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFaktur, setSelectedFaktur] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState([]);
    const rowsPerPage = 20;

    useEffect(() => {
        fetchDataFaktur();
    }, []);

    const fetchDataFaktur = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/monitoring-beli`);
            setDataFaktur(response.data);
        } catch (error) {
            console.error("❌ Error fetching data monitoring beli:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailBeli = async (noFaktur) => {
        setDetailLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/detailbeli/${noFaktur}`);
            setDetailData(response.data);
        } catch (error) {
            console.error("❌ Error fetching detail beli:", error);
            setDetailData([]);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRowClick = async (item) => {
        setSelectedFaktur(item);
        setShowDetailModal(true);
        await fetchDetailBeli(item.no_faktur);
    };

    const closeModal = () => {
        setShowDetailModal(false);
        setSelectedFaktur(null);
        setDetailData([]);
    };

    const filteredData = dataFaktur.filter(
        (item) =>
            item.nama_vendor?.toLowerCase().includes(search.toLowerCase()) ||
            item.no_faktur?.toLowerCase().includes(search.toLowerCase()) ||
            item.nama_apotek?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <MainLayout>
            <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 md:mb-0">
                        Monitoring Pembelian
                    </h2>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari Vendor / No Faktur / Apotek..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table & Loading */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-600">
                                <tr>
                                    {[
                                        "No",
                                        "Kode Apotek",
                                        "Nama Apotek",
                                        "Vendor",
                                        "No Faktur",
                                        "No Penerimaan",
                                        "Tgl Penerimaan",
                                        "Tgl Terima Fisik Faktur",
                                        "Kode Obat",
                                        "Nama Obat",
                                        "Jumlah Netto",
                                    ].map((head, idx) => (
                                        <th
                                            key={idx}
                                            scope="col"
                                            className={`px-6 py-3 text-xs font-medium text-white uppercase tracking-wider`}
                                        >
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {currentRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="15"
                                            className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                                        >
                                            Tidak ada data yang ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    currentRows.map((item, index) => (
                                        <tr
                                            key={item.id || index}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => handleRowClick(item)}
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                                {indexOfFirstRow + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.kode_outlet || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.nama_apotek || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.nama_vendor || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.no_faktur || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.nomor_penerimaan || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {formatTanggal(item.tanggal_penerimaan)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.tanggal_terima_fisik_faktur || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                {formatAngka(item.kode_obat)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                {formatAngka(item.nama_obat)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                                {formatAngka(item.jumlah_netto)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4 px-2">
                            <div className="text-sm text-gray-700">
                                Menampilkan{" "}
                                <span className="font-medium">{indexOfFirstRow + 1}</span> sampai{" "}
                                <span className="font-medium">
                  {Math.min(indexOfLastRow, filteredData.length)}
                </span>{" "}
                                dari <span className="font-medium">{filteredData.length}</span>{" "}
                                hasil
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 border rounded-md ${
                                        currentPage === 1
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    Sebelumnya
                                </button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-4 py-2 rounded-md ${
                                                    currentPage === pageNum
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <>
                                            <span className="px-2 py-2">...</span>
                                            <button
                                                onClick={() => handlePageChange(totalPages)}
                                                className={`px-4 py-2 rounded-md ${
                                                    currentPage === totalPages
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                                }`}
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={() =>
                                        handlePageChange(Math.min(currentPage + 1, totalPages))
                                    }
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 border rounded-md ${
                                        currentPage === totalPages
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Modal Detail */}
                {showDetailModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    Detail Pembelian - {selectedFaktur?.no_faktur || 'No Faktur'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {detailLoading ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : detailData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Barang</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {detailData.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.kode_barang}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{item.nama_barang}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.satuan}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAngka(item.qty)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAngka(item.harga)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatAngka(item.subtotal)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        Tidak ada data detail pembelian
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end p-6 border-t">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default MonitoringBeli;