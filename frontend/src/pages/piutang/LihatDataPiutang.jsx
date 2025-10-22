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
    Divider
} from 'antd';
import {
    SearchOutlined,
    PrinterOutlined,
    ReloadOutlined,
    FilterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import MainLayout from '../../layouts/MainLayout';
import debounce from 'lodash.debounce';

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
        dari_kwitansi: '',
        sampai_kwitansi: '',
        dari_pelayanan: '',
        sampai_pelayanan: '',
        penjamin: ''
    });
    const [isFiltered, setIsFiltered] = useState(false);

    const navigate = useNavigate();

    // === Ambil data dari backend ===
    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const queryParams = {
                ...params,
                dari_kwitansi: params.dari_kwitansi
                    ? dayjs(params.dari_kwitansi).format('YYYY-MM-DD')
                    : '',
                sampai_kwitansi: params.sampai_kwitansi
                    ? dayjs(params.sampai_kwitansi).format('YYYY-MM-DD')
                    : '',
                dari_pelayanan: params.dari_pelayanan
                    ? dayjs(params.dari_pelayanan).format('YYYY-MM-DD')
                    : '',
                sampai_pelayanan: params.sampai_pelayanan
                    ? dayjs(params.sampai_pelayanan).format('YYYY-MM-DD')
                    : '',
                page: params.current || pagination.current,
                limit: params.pageSize || pagination.pageSize
            };

            const response = await axios.get('/api/kwitansi', {
                params: queryParams
            });

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
        fetchData({
            ...filters,
            current: 1
        });
    };

    // === Reset Filter ===
    const handleResetFilters = () => {
        setFilters({
            dari_kwitansi: '',
            sampai_kwitansi: '',
            dari_pelayanan: '',
            sampai_pelayanan: '',
            penjamin: ''
        });
        setIsFiltered(false);
        fetchData({
            current: 1
        });
    };

    // === Debounce Pencarian ===
    const debouncedSearch = debounce((value) => {
        setFilters((prev) => ({ ...prev, penjamin: value }));
    }, 500);

    // === Pagination ===
    const handleTableChange = (newPagination) => {
        fetchData({
            ...filters,
            current: newPagination.current,
            pageSize: newPagination.pageSize
        });
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
                    {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(text)}
                </Tag>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    icon={<PrinterOutlined />}
                    onClick={() => navigate(`/cetak-kwitansi/${record.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="middle"
                >
                    Cetak
                </Button>
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
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleResetFilters}
                        disabled={loading}
                        className="mr-2"
                    >
                        Reset
                    </Button>
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
                                value={
                                    filters.dari_kwitansi
                                        ? dayjs(filters.dari_kwitansi)
                                        : null
                                }
                                onChange={(date) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        dari_kwitansi: date
                                    }))
                                }
                                suffixIcon={<FilterOutlined />}
                            />
                            <DatePicker
                                placeholder="Sampai"
                                format="DD/MM/YYYY"
                                value={
                                    filters.sampai_kwitansi
                                        ? dayjs(filters.sampai_kwitansi)
                                        : null
                                }
                                onChange={(date) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        sampai_kwitansi: date
                                    }))
                                }
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
                                value={
                                    filters.dari_pelayanan
                                        ? dayjs(filters.dari_pelayanan)
                                        : null
                                }
                                onChange={(date) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        dari_pelayanan: date
                                    }))
                                }
                                suffixIcon={<FilterOutlined />}
                            />
                            <DatePicker
                                placeholder="Sampai"
                                format="DD/MM/YYYY"
                                value={
                                    filters.sampai_pelayanan
                                        ? dayjs(filters.sampai_pelayanan)
                                        : null
                                }
                                onChange={(date) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        sampai_pelayanan: date
                                    }))
                                }
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
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
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
                                    <Text type="secondary">
                                        {loading
                                            ? 'Memuat data...'
                                            : 'Tidak ada data ditemukan'}
                                    </Text>
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
