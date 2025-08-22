import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, message, Space, Popconfirm } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import MainLayout from '../../../layouts/MainLayout';

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
            const response = await axios.get('http://localhost:5000/api/faktur/uploads');
            setUploadedFiles(response.data);
        } catch (error) {
            message.error('Gagal memuat daftar file');
        } finally {
            setIsFetching(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatus('Silakan pilih file terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        setStatus('');

        try {
            const res = await axios.post('http://localhost:5000/api/faktur/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setStatus({ type: 'success', message: res.data.message });
            setFile(null);
            setFileName('');
            fetchUploadedFiles(); // Refresh the list after upload
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Gagal upload file';
            setStatus({ type: 'error', message: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        try {
            await axios.delete(`http://localhost:5000/api/faktur/uploads/${fileId}`);
            message.success('File berhasil dihapus');
            fetchUploadedFiles(); // Refresh the list after deletion
        } catch (error) {
            message.error('Gagal menghapus file');
        }
    };

    const columns = [
        {
            title: 'Nama File',
            dataIndex: 'filename',
            key: 'filename',
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Tanggal Upload',
            dataIndex: 'uploadDate',
            key: 'uploadDate',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Ukuran',
            dataIndex: 'size',
            key: 'size',
            render: (size) => `${(size / 1024).toFixed(2)} KB`
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={() => window.open(`http://localhost:5000/api/faktur/uploads/${record._id}/download`, '_blank')}
                    >
                        Unduh
                    </Button>
                    <Popconfirm
                        title="Apakah Anda yakin ingin menghapus file ini?"
                        onConfirm={() => handleDeleteFile(record._id)}
                        okText="Ya"
                        cancelText="Tidak"
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
            )
        }
    ];

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
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
                                />
                            </label>
                            <div className="flex-1">
                                {fileName ? (
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                                {fileName}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFile(null);
                                                    setFileName('');
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
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
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Daftar File Terupload</h3>
                    <Table
                        columns={columns}
                        dataSource={uploadedFiles}
                        rowKey="_id"
                        loading={isFetching}
                        locale={{
                            emptyText: 'Belum ada file yang diupload'
                        }}
                        pagination={{ pageSize: 5 }}
                    />
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Petunjuk Upload</h3>
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                        <li>Pastikan file dalam format Excel (.xlsx atau .xls)</li>
                        <li>File harus sesuai dengan template yang telah ditentukan</li>
                        <li>Maksimal ukuran file: 5MB</li>
                        <li>Proses upload mungkin memakan waktu beberapa saat</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
};

export default UploadFaktur;