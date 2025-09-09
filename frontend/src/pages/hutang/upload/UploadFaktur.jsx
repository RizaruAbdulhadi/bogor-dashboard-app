import React, { useState, useEffect } from 'react';
import { Table, Button, message, Space, Popconfirm } from 'antd';
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
            console.log('Fetching uploaded files...');
            const response = await api.get('/faktur/uploads');
            console.log('API Response:', response.data);

            // Debug: Log struktur response
            if (response.data && typeof response.data === 'object') {
                console.log('Response keys:', Object.keys(response.data));
                if (Array.isArray(response.data.files)) {
                    console.log('Files array length:', response.data.files.length);
                }
                if (Array.isArray(response.data)) {
                    console.log('Direct array length:', response.data.length);
                }
            }

            // Pastikan response.data adalah array
            let filesData = [];
            if (Array.isArray(response.data)) {
                filesData = response.data;
            } else if (response.data && Array.isArray(response.data.files)) {
                filesData = response.data.files;
            } else if (response.data && Array.isArray(response.data.data)) {
                filesData = response.data.data;
            } else {
                console.warn('Unexpected response format:', response.data);
                message.warning('Format data tidak sesuai');
            }

            // Filter data yang invalid
            const validFiles = filesData.filter(file =>
                file &&
                (file.filename || file.originalname || file.name) &&
                (file._id || file.id)
            );

            console.log('Valid files:', validFiles);
            setUploadedFiles(validFiles);

        } catch (error) {
            console.error('Error fetching files:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
            }
            message.error('Gagal memuat daftar file');
            setUploadedFiles([]);
        } finally {
            setIsFetching(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validasi file type dan size
            const allowedTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/vnd.ms-excel.sheet.macroEnabled.12'
            ];

            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
            const isExcelFile = fileExtension === 'xlsx' || fileExtension === 'xls';

            if (!allowedTypes.includes(selectedFile.type) && !isExcelFile) {
                message.error('Hanya file Excel (.xlsx, .xls) yang diizinkan');
                return;
            }

            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
                message.error('Ukuran file maksimal 5MB');
                return;
            }

            setFile(selectedFile);
            setFileName(selectedFile.name);
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
            const res = await api.post('/faktur/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStatus({ type: 'success', message: res.data.message || 'File berhasil diupload' });
            setFile(null);
            setFileName('');
            // Reset input file
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';

            // Refresh list setelah upload
            setTimeout(() => fetchUploadedFiles(), 1000);

        } catch (err) {
            console.error('Upload error:', err);
            const errorMsg = err.response?.data?.message ||
                err.response?.data?.error ||
                'Gagal upload file';
            setStatus({ type: 'error', message: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        try {
            await api.delete(`/faktur/uploads/${fileId}`);
            message.success('File berhasil dihapus');
            fetchUploadedFiles(); // Refresh the list after deletion
        } catch (error) {
            console.error('Delete error:', error);
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.error ||
                'Gagal menghapus file';
            message.error(errorMsg);
        }
    };

    const handleDownloadFile = async (fileId, filename) => {
        try {
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

        } catch (error) {
            console.error('Download error:', error);
            message.error('Gagal mengunduh file');
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
                const fileName = text || record.originalname || record.name;
                return fileName ? (
                    <span className="font-medium" title={fileName}>
                        {fileName}
                    </span>
                ) : (
                    <span className="text-gray-400">No filename</span>
                );
            }
        },
        {
            title: 'Tanggal Upload',
            dataIndex: 'uploadDate',
            key: 'uploadDate',
            render: (date, record) => {
                const dateToFormat = date || record.createdAt || record.uploadedAt;
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
            render: (status) => {
                if (!status) return <span className="text-gray-400">-</span>;
                return (
                    <span className={`px-2 py-1 rounded text-xs ${
                        status === 'processed' || status === 'success' ? 'bg-green-100 text-green-800' :
                            status === 'error' || status === 'failed' ? 'bg-red-100 text-red-800' :
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
                // Hanya tampilkan aksi untuk record yang valid
                if (!record._id && !record.id) {
                    return <span className="text-gray-400">No actions</span>;
                }

                const fileId = record._id || record.id;
                const fileName = record.filename || record.originalname || record.name;

                return (
                    <Space size="middle">
                        <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            onClick={() => handleDownloadFile(fileId, fileName)}
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
                            File Excel (.xlsx, .xls)
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
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Ukuran: {(file.size / 1024).toFixed(2)} KB
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
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </>
                            ) : (
                                'Upload File'
                            )}
                        </button>
                    </div>
                </form>

                {status && (
                    <div className={`mt-4 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
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
                        <Button
                            icon={<ReloadOutlined />}
                            size="small"
                            onClick={fetchUploadedFiles}
                            loading={isFetching}
                        >
                            Refresh
                        </Button>
                    </div>

                    {uploadedFiles.length === 0 && !isFetching ? (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m0 0V9m0 8h6m-6-4h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2">Belum ada file yang diupload</p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={uploadedFiles}
                            rowKey={(record) => record._id || record.id || Math.random()}
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
                        <li>Maksimal ukuran file: 5MB</li>
                        <li>Proses upload mungkin memakan waktu beberapa saat</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
};

export default UploadFaktur;