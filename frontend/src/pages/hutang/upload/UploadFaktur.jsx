import React, { useState, useEffect } from 'react';
import { Table, Button, message, Space, Popconfirm, Spin } from 'antd';
import { DeleteOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import MainLayout from '../../../layouts/MainLayout';
import api from '../../../api';

const UploadFaktur = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isFetching, setIsFetching] = useState(false);

    // Fetch uploaded files on component mount
    useEffect(() => {
        fetchUploadedFiles();
    }, []);

    const fetchUploadedFiles = async () => {
        setIsFetching(true);
        try {
            console.log('🔄 Fetching uploaded files...');
            const response = await api.get('/faktur/uploads');
            console.log('📦 API Response:', response.data);

            // Handle berbagai format response
            let filesData = [];

            if (Array.isArray(response.data)) {
                filesData = response.data;
                console.log('✅ Data dari array langsung:', filesData.length);
            }
            else if (response.data && Array.isArray(response.data.files)) {
                filesData = response.data.files;
                console.log('✅ Data dari response.data.files:', filesData.length);
            }
            else if (response.data && Array.isArray(response.data.data)) {
                filesData = response.data.data;
                console.log('✅ Data dari response.data.data:', filesData.length);
            }
            else if (response.data && typeof response.data === 'object') {
                // Coba extract data dari object
                const possibleArrays = Object.values(response.data).filter(item => Array.isArray(item));
                if (possibleArrays.length > 0) {
                    filesData = possibleArrays[0];
                    console.log('✅ Data dari object values:', filesData.length);
                } else {
                    console.warn('❌ Format response tidak dikenali:', response.data);
                    message.warning('Format data dari server tidak dikenali');
                }
            }
            else {
                console.warn('❌ Response tidak valid:', response.data);
                message.warning('Format data tidak sesuai');
            }

            // Filter data yang invalid
            const validFiles = filesData.filter(file =>
                file &&
                (file.filename || file.originalname || file.name || file.fileName) &&
                (file._id || file.id || file.fileId)
            );

            console.log('📊 Valid files found:', validFiles.length);
            console.log('📝 Valid files details:', validFiles);

            setUploadedFiles(validFiles);

            if (validFiles.length === 0) {
                console.log('ℹ️ Tidak ada file valid yang ditemukan');
            }

        } catch (error) {
            console.error('❌ Error fetching files:', error);
            if (error.response) {
                console.error('📡 Error response:', error.response.data);
                console.error('🔢 Error status:', error.response.status);
                console.error('🧾 Error headers:', error.response.headers);
            }
            message.error('Gagal memuat daftar file: ' + (error.response?.data?.message || error.message));
            setUploadedFiles([]);
        } finally {
            setIsFetching(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validasi file type
            const allowedTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/vnd.ms-excel.sheet.macroEnabled.12',
                'application/octet-stream' // untuk beberapa jenis excel
            ];

            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
            const isExcelFile = fileExtension === 'xlsx' || fileExtension === 'xls';

            if (!allowedTypes.includes(selectedFile.type) && !isExcelFile) {
                message.error('Hanya file Excel (.xlsx, .xls) yang diizinkan');
                return;
            }

            // Maksimal 15MB (15 * 1024 * 1024 = 15728640 bytes)
            if (selectedFile.size > 15 * 1024 * 1024) {
                message.error('Ukuran file maksimal 15MB');
                return;
            }

            setFile(selectedFile);
            setFileName(selectedFile.name);
            console.log('📁 File selected:', selectedFile.name, 'Size:', selectedFile.size);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatus({ type: 'error', message: 'Silakan pilih file terlebih dahulu' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        setStatus('');

        try {
            console.log('🚀 Starting file upload...');
            const res = await api.post('/faktur/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30 detik timeout
            });

            console.log('✅ Upload success:', res.data);

            setStatus({
                type: 'success',
                message: res.data.message || 'File berhasil diupload dan diproses'
            });

            setFile(null);
            setFileName('');

            // Reset input file
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';

            // Tunggu sebentar lalu refresh data
            message.success('File berhasil diupload! Memuat data terbaru...');

            // Delay untuk memastikan backend sudah selesai memproses
            setTimeout(() => {
                fetchUploadedFiles();
            }, 2000);

        } catch (err) {
            console.error('❌ Upload error:', err);
            let errorMsg = 'Gagal upload file';

            if (err.response) {
                console.error('📡 Response error:', err.response.data);
                errorMsg = err.response.data?.message ||
                    err.response.data?.error ||
                    `Error ${err.response.status}: ${err.response.statusText}`;
            } else if (err.request) {
                console.error('🌐 Network error:', err.request);
                errorMsg = 'Tidak dapat terhubung ke server';
            } else {
                console.error('⚡ Unexpected error:', err.message);
                errorMsg = err.message;
            }

            setStatus({ type: 'error', message: errorMsg });
            message.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        try {
            console.log('🗑️ Deleting file:', fileId);
            await api.delete(`/faktur/uploads/${fileId}`);
            message.success('File berhasil dihapus');

            // Refresh list setelah deletion
            fetchUploadedFiles();

        } catch (error) {
            console.error('❌ Delete error:', error);
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.error ||
                'Gagal menghapus file';
            message.error(errorMsg);
        }
    };

    const handleDownloadFile = async (fileId, filename) => {
        try {
            console.log('📥 Downloading file:', fileId, filename);
            const response = await api.get(`/faktur/uploads/${fileId}/download`, {
                responseType: 'blob'
            });

            // Create blob link
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename || 'file.xlsx');
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            message.success('Download started');

        } catch (error) {
            console.error('❌ Download error:', error);
            message.error('Gagal mengunduh file: ' + (error.response?.data?.message || error.message));
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'index',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Nama File',
            dataIndex: 'filename',
            key: 'filename',
            render: (text, record) => {
                const fileName = text || record.originalname || record.name || record.fileName;
                return fileName ? (
                    <span className="font-medium" title={fileName}>
                        {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
                    </span>
                ) : (
                    <span className="text-gray-400 italic">no filename</span>
                );
            }
        },
        {
            title: 'Tanggal Upload',
            dataIndex: 'uploadDate',
            key: 'uploadDate',
            render: (date, record) => {
                const dateToFormat = date || record.createdAt || record.uploadedAt || record.uploadDate;
                return dateToFormat ? (
                    new Date(dateToFormat).toLocaleString('id-ID')
                ) : (
                    <span className="text-gray-400">-</span>
                );
            }
        },
        {
            title: 'Ukuran',
            dataIndex: 'size',
            key: 'size',
            render: (size) => {
                if (!size || size === 0) return <span className="text-gray-400">-</span>;
                return size > 1024 * 1024
                    ? `${(size / (1024 * 1024)).toFixed(2)} MB`
                    : `${(size / 1024).toFixed(2)} KB`;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                if (!status) {
                    // Coba deteksi status dari field lain
                    const processingStatus = record.processingStatus || record.state;
                    if (processingStatus) return processingStatus;
                    return <span className="text-gray-400">unknown</span>;
                }
                return (
                    <span className={`px-2 py-1 rounded text-xs ${
                        status === 'processed' || status === 'success' || status === 'completed' ? 'bg-green-100 text-green-800' :
                            status === 'error' || status === 'failed' ? 'bg-red-100 text-red-800' :
                                status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                    }`}>
                        {status}
                    </span>
                );
            }
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 200,
            render: (_, record) => {
                // Cari ID file dari berbagai kemungkinan field
                const fileId = record._id || record.id || record.fileId;
                const fileName = record.filename || record.originalname || record.name || record.fileName;

                if (!fileId) {
                    return <span className="text-gray-400 italic">no actions</span>;
                }

                return (
                    <Space size="middle">
                        <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            onClick={() => handleDownloadFile(fileId, fileName)}
                            title="Download file"
                        >
                            Unduh
                        </Button>
                        <Popconfirm
                            title="Apakah Anda yakin ingin menghapus file ini?"
                            onConfirm={() => handleDeleteFile(fileId)}
                            okText="Ya"
                            cancelText="Tidak"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                title="Hapus file"
                            >
                                Hapus
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Data Faktur</h2>

                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            File Excel (.xlsx, .xls) - Maksimal 15MB
                        </label>
                        <div className="flex items-center space-x-4">
                            <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-600 rounded-lg border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="mt-2 text-sm font-medium">Pilih File</span>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="fileInput"
                                />
                            </label>
                            <div className="flex-1">
                                {fileName ? (
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-xs" title={fileName}>
                                                {fileName}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFile(null);
                                                    setFileName('');
                                                    const fileInput = document.getElementById('fileInput');
                                                    if (fileInput) fileInput.value = '';
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                                title="Hapus file"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Ukuran: {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Belum ada file dipilih</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!file || isLoading}
                            className={`px-6 py-2 rounded-md text-white font-medium ${(!file || isLoading) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors flex items-center`}
                        >
                            {isLoading ? (
                                <>
                                    <Spin size="small" className="mr-2" />
                                    Memproses...
                                </>
                            ) : (
                                'Upload File'
                            )}
                        </button>
                    </div>
                </form>

                {status && (
                    <div className={`mt-4 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        <div className="flex items-center">
                            {status.type === 'success' ? (
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            <span>{status.message}</span>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800">Daftar File Terupload</h3>
                        <Space>
                            <span className="text-sm text-gray-500">
                                Total: {uploadedFiles.length} file
                            </span>
                            <Button
                                icon={<ReloadOutlined />}
                                size="small"
                                onClick={fetchUploadedFiles}
                                loading={isFetching}
                                title="Refresh data"
                            >
                                Refresh
                            </Button>
                        </Space>
                    </div>

                    {uploadedFiles.length === 0 && !isFetching ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m0 0V9m0 8h6m-6-4h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-medium">Belum ada file yang diupload</p>
                            <p className="text-sm mt-1">Upload file Excel pertama Anda untuk melihatnya di sini</p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={uploadedFiles}
                            rowKey={(record) => record._id || record.id || record.fileId || Math.random()}
                            loading={isFetching}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} dari ${total} file`,
                                total: uploadedFiles.length
                            }}
                            scroll={{ x: 800 }}
                        />
                    )}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Petunjuk Upload</h3>
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                        <li>Pastikan file dalam format Excel (.xlsx atau .xls)</li>
                        <li>File harus sesuai dengan template yang telah ditentukan</li>
                        <li>Kolom yang wajib ada: No Faktur, Tanggal Faktur, DPP, PPN, dll</li>
                        <li><strong>Maksimal ukuran file: 15MB</strong></li>
                        <li>Proses upload mungkin memakan waktu beberapa saat</li>
                        <li>Jika data tidak muncul, klik tombol "Refresh"</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
};

export default UploadFaktur;