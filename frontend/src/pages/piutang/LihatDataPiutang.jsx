import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    Button,
    DatePicker,
    Input,
    message,
    Spin,
    Card,
    Space,
    Tag,
    Typography,
    Divider,
    Popconfirm
} from 'antd';
import {
    SearchOutlined,
    PrinterOutlined,
    ReloadOutlined,
    FilterOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import MainLayout from '../../layouts/MainLayout';
import debounce from 'lodash.debounce';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const { Text } = Typography;

const LihatDataPiutang = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [filters, setFilters] = useState({
        dari_kwitansi: null,
        sampai_kwitansi: null,
        dari_pelayanan: null,
        sampai_pelayanan: null,
        penjamin: ''
    });
    const [isFiltered, setIsFiltered] = useState(false);

    const navigate = useNavigate();

    // === Ambil data dari backend ===
    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const queryParams = {
                page: params.current || pagination.current,
                limit: params.pageSize || pagination.pageSize
            };

            if (params.penjamin) queryParams.penjamin = params.penjamin;
            if (params.dari_kwitansi) queryParams.dari_kwitansi = dayjs(params.dari_kwitansi).format('YYYY-MM-DD');
            if (params.sampai_kwitansi) queryParams.sampai_kwitansi = dayjs(params.sampai_kwitansi).format('YYYY-MM-DD');
            if (params.dari_pelayanan) queryParams.dari_pelayanan = dayjs(params.dari_pelayanan).format('YYYY-MM-DD');
            if (params.sampai_pelayanan) queryParams.sampai_pelayanan = dayjs(params.sampai_pelayanan).format('YYYY-MM-DD');

            const response = await axios.get('/api/kwitansi', { params: queryParams });

            setData(response.data.data || response.data);
            setPagination({
                current: queryParams.page,
                pageSize: queryParams.limit,
                total: response.data.total || response.data.length || 0
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Gagal memuat data piutang');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // === Tombol Cari ===
    const handleSearch = () => {
        const hasFilters =
            filters.dari_kwitansi ||
            filters.sampai_kwitansi ||
            filters.dari_pelayanan ||
            filters.sampai_pelayanan ||
            filters.penjamin;

        setIsFiltered(hasFilters);
        fetchData({ ...filters, current: 1 });
    };

    // === Reset Filter ===
    const handleResetFilters = () => {
        setFilters({
            dari_kwitansi: null,
            sampai_kwitansi: null,
            dari_pelayanan: null,
            sampai_pelayanan: null,
            penjamin: ''
        });
        setIsFiltered(false);
        fetchData({ current: 1 });
    };

    // === Debounce pencarian penjamin ===
    const debouncedSearch = debounce((value) => {
        setFilters((prev) => ({ ...prev, penjamin: value }));
    }, 500);

    // === Pagination ===
    const handleTableChange = (newPagination) => {
        fetchData({ ...filters, current: newPagination.current, pageSize: newPagination.pageSize });
    };

    // === Download Excel ===
    const handleDownload = () => {
        if (!data || data.length === 0) {
            message.warning('Tidak ada data untuk diunduh');
            return;
        }

        const exportData = data.map((item) => ({
            'No. Kwitansi': item.nomor_kwitansi,
            'Nama Penjamin': item.nama_penjamin,
            'Tanggal Kwitansi': item.tanggal ? dayjs(item.tanggal).format('DD/MM/YYYY') : '',
            'Tanggal Pelayanan': item.tanggal_pelayanan ? dayjs(item.tanggal_pelayanan).format('DD/MM/YYYY') : '',
            Nominal: item.nominal
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Piutang');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, 'data_piutang.xlsx');
    };

    // === Kolom Tabel ===
    const columns = [
        {
            title: 'No. Kwitansi',
            dataIndex: 'nomor_kwitansi',
            key: 'nomor_kwitansi',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Nama Penjamin',
            dataIndex: 'nama_penjamin',
            key: 'nama_penjamin',
            render: (text) => <Text>{text}</Text>
        },
        {
            title: 'Tanggal Kwitansi',
            dataIndex: 'tanggal',
            key: 'tanggal',
            render: (text) => (text ? dayjs(text).format('DD/MM/YYYY') : '-')
        },
        {
            title: 'Tanggal Pelayanan',
            dataIndex: 'tanggal_pelayanan',
            key: 'tanggal_pelayanan',
            render: (text) => (text ? dayjs(text).format('DD/MM/YYYY') : '-')
        },
        {
            title: 'Nominal',
            dataIndex: 'nominal',
            key: 'nominal',
            align: 'right',
            render: (text) => (
                <Tag color="blue" style={{ fontSize: '13px' }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(text)}
                </Tag>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={() => navigate(`/cetak-kwitansi/${record.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="middle"
                    >
                        Cetak
                    </Button>
                    <Popconfirm
                        title="Yakin ingin menghapus kwitansi ini?"
                        onConfirm={async () => {
                            try {
                                await axios.delete(`/api/kwitansi/${record.id}`);
                                message.success('Kwitansi berhasil dihapus');
                                fetchData({ ...filters, current: pagination.current });
                            } catch (error) {
                                console.error(error);
                                message.error('Gagal menghapus kwitansi');
                            }
                        }}
                        okText="Ya"
                        cancelText="Batal"
                    >
                        <Button type="primary" danger size="middle">
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <MainLayout>
            <Card
                title={<span className="text-xl font-semibold">Data Piutang</span>}
                bordered={false}
                className="shadow-md rounded-lg"
                extra={
                    <Space>
                        <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={loading || !data.length}>
                            Download
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={handleResetFilters} disabled={loading}>
                            Reset
                        </Button>
                    </Space>
                }
            >
                {/* === FILTER AREA === */}
                <div className="mb-6 space-y-4">
                    <div>
                        <Text strong>Tanggal Kwitansi:</Text>
                        <Space size="middle" wrap className="ml-3">
                            <DatePicker
                                placeholder="Dari"
                                format="DD/MM/YYYY"
                                value={filters.dari_kwitansi ? dayjs(filters.dari_kwitansi) : null}
                                onChange={(date) => setFilters((prev) => ({ ...prev, dari_kwitansi: date }))}
                                suffixIcon={<FilterOutlined />}
                            />
                            <DatePicker
                                placeholder="Sampai"
                                format="DD/MM/YYYY"
                                value={filters.sampai_kwitansi ? dayjs(filters.sampai_kwitansi) : null}
                                onChange={(date) => setFilters((prev) => ({ ...prev, sampai_kwitansi: date }))}
                                suffixIcon={<FilterOutlined />}
                            />
                        </Space>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <div>
                        <Text strong>Tanggal Pelayanan:</Text>
                        <Space size="middle" wrap className="ml-3">
                            <DatePicker
                                placeholder="Dari"
                                format="DD/MM/YYYY"
                                value={filters.dari_pelayanan ? dayjs(filters.dari_pelayanan) : null}
                                onChange={(date) => setFilters((prev) => ({ ...prev, dari_pelayanan: date }))}
                                suffixIcon={<FilterOutlined />}
                            />
                            <DatePicker
                                placeholder="Sampai"
                                format="DD/MM/YYYY"
                                value={filters.sampai_pelayanan ? dayjs(filters.sampai_pelayanan) : null}
                                onChange={(date) => setFilters((prev) => ({ ...prev, sampai_pelayanan: date }))}
                                suffixIcon={<FilterOutlined />}
                            />
                        </Space>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <Space size="middle" wrap>
                        <Input
                            placeholder="Cari Penjamin..."
                            value={filters.penjamin}
                            onChange={(e) => debouncedSearch(e.target.value)}
                            allowClear
                            suffix={<SearchOutlined />}
                            className="w-full md:w-64"
                        />
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading} className="bg-green-600 hover:bg-green-700 text-white">
                            Cari
                        </Button>
                    </Space>

                    {isFiltered && (
                        <div className="mt-3">
                            <Tag color="orange" closable onClose={handleResetFilters}>
                                Filter Aktif
                            </Tag>
                        </div>
                    )}
                </div>

                {/* === TABLE === */}
                <Spin spinning={loading} tip="Memuat data...">
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total) => `Total ${total} data`
                        }}
                        onChange={handleTableChange}
                        locale={{
                            emptyText: (
                                <div className="py-8">
                                    <Text type="secondary">{loading ? 'Memuat data...' : 'Tidak ada data ditemukan'}</Text>
                                </div>
                            )
                        }}
                        scroll={{ x: true }}
                        bordered
                    />
                </Spin>
            </Card>
        </MainLayout>
    );
};

export default LihatDataPiutang;
