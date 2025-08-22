import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, DatePicker, Input, message, Spin, Card, Space, Tag, Typography } from 'antd';
import { SearchOutlined, PrinterOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
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
        dari: '',
        sampai: '',
        penjamin: ''
    });
    const [isFiltered, setIsFiltered] = useState(false);

    const navigate = useNavigate();

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const queryParams = {
                ...params,
                dari: params.dari ? dayjs(params.dari).format('YYYY-MM-DD') : '',
                sampai: params.sampai ? dayjs(params.sampai).format('YYYY-MM-DD') : '',
                page: params.current || pagination.current,
                limit: params.pageSize || pagination.pageSize
            };

            const response = await axios.get('/api/kwitansi', {
                params: queryParams
            });

            setData(response.data.data || response.data); // Handle both formats
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

    const handleSearch = () => {
        const hasFilters = filters.dari || filters.sampai || filters.penjamin;
        setIsFiltered(hasFilters);
        fetchData({
            ...filters,
            current: 1
        });
    };

    const handleResetFilters = () => {
        setFilters({
            dari: '',
            sampai: '',
            penjamin: ''
        });
        setIsFiltered(false);
        fetchData({
            dari: '',
            sampai: '',
            penjamin: '',
            current: 1
        });
    };

    const debouncedSearch = debounce((value) => {
        setFilters((prev) => ({ ...prev, penjamin: value }));
    }, 500);

    const handleTableChange = (newPagination) => {
        fetchData({
            ...filters,
            current: newPagination.current,
            pageSize: newPagination.pageSize
        });
    };

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
            title: 'Tanggal',
            dataIndex: 'tanggal',
            key: 'tanggal',
            render: (text) => dayjs(text).format('DD/MM/YYYY'),
            sorter: (a, b) => dayjs(a.tanggal).unix() - dayjs(b.tanggal).unix()
        },
        {
            title: 'Nominal',
            dataIndex: 'nominal',
            key: 'nominal',
            render: (text) => (
                <Tag color="blue" style={{ fontSize: '13px' }}>
                    {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(text)}
                </Tag>
            ),
            align: 'right'
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
                <div className="mb-6">
                    <Space size="middle" wrap>
                        <DatePicker
                            placeholder="Dari Tanggal"
                            format="DD/MM/YYYY"
                            value={filters.dari ? dayjs(filters.dari) : null}
                            onChange={(date) => setFilters((prev) => ({ ...prev, dari: date }))}
                            className="w-full md:w-48"
                            suffixIcon={<FilterOutlined />}
                        />
                        <DatePicker
                            placeholder="Sampai Tanggal"
                            format="DD/MM/YYYY"
                            value={filters.sampai ? dayjs(filters.sampai) : null}
                            onChange={(date) => setFilters((prev) => ({ ...prev, sampai: date }))}
                            className="w-full md:w-48"
                            suffixIcon={<FilterOutlined />}
                        />
                        <Input
                            placeholder="Cari Penjamin..."
                            value={filters.penjamin}
                            onChange={(e) => debouncedSearch(e.target.value)}
                            className="w-full md:w-64"
                            allowClear
                            suffix={<SearchOutlined />}
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
                            showTotal: (total) => `Total ${total} data`,
                            className: 'mt-4'
                        }}
                        onChange={handleTableChange}
                        locale={{
                            emptyText: (
                                <div className="py-8">
                                    <Text type="secondary">
                                        {loading ? 'Memuat data...' : 'Tidak ada data ditemukan'}
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