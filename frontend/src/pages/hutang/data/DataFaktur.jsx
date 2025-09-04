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

const DataFaktur = () => {
    const [dataFaktur, setDataFaktur] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    useEffect(() => {
        fetchDataFaktur();
    }, []);

    const fetchDataFaktur = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/faktur`);
            setDataFaktur(response.data);
        } catch (error) {
            console.error("❌ Error fetching data faktur:", error);
        } finally {
            setLoading(false);
        }
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
                        Data Status Faktur
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
                                        "No Tukar Faktur",
                                        "DPP",
                                        "PPN",
                                        "Total",
                                        "AP1",
                                        "AP2",
                                        "AP3",
                                        "Jenis",
                                    ].map((head, idx) => (
                                        <th
                                            key={idx}
                                            scope="col"
                                            className={`px-6 py-3 text-xs font-medium text-white uppercase tracking-wider ${
                                                ["DPP", "PPN", "Total"].includes(head)
                                                    ? "text-right"
                                                    : "text-left"
                                            }`}
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
                                            key={item.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                                {indexOfFirstRow + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.kode_apotek || "-"}
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
                                                {item.nomor_tukar_faktur || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                {formatAngka(item.dpp)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                {formatAngka(item.ppn)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                                {formatAngka(item.total)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.ap1 || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.ap2 || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.ap3 || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.jenis || "-"}
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
            </div>
        </MainLayout>
    );
};

export default DataFaktur;
