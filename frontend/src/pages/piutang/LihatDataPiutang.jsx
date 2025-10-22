import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, Button, DatePicker, Input, message, Spin, Card, Space, Tag, Typography, Popconfirm, Select
} from 'antd';
import { SearchOutlined, PrinterOutlined, ReloadOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import MainLayout from '../../layouts/MainLayout';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const { Text } = Typography;

const LihatDataPiutang = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filters, setFilters] = useState({
        filterBy: 'kwitansi',
        dari: null,
        sampai: null,
        penjamin: ''
    });
    const [isFiltered, setIsFiltered] = useState(false);
    const navigate = useNavigate();

    // Ambil data dari backend
    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const queryParams = {
                page: params.current || pagination.current,
                limit: params.pageSize || pagination.pageSize,
                filterBy: params.filterBy || filters.filterBy,
                dari: params.dari || (filters.dari ? dayjs(filters.dari).format('YYYY-MM-DD') : null),
                sampai: params.sampai || (filters.sampai ? dayjs(filters.sampai).format('YYYY-MM-DD') : null),
                penjamin: params.penjamin !== undefined ? params.penjamin : filters.penjamin
            };

            const response = await axios.get('/api/kwitansi', { params: queryParams });

            setData(response.data.data || response.data);
            setPagination({
                current: queryParams.page,
                pageSize: queryParams.limit,
                total: response.data.total || (response.data.data ? response.data.data.length : response.data.length || 0)
            });
        } catch (error) {
            console.error(error);
            message.error('Gagal memuat data piutang');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Cari / filter
    const handleSearch = () => {
        const hasFilters = filters.dari || filters.sampai || filters.penjamin;
        setIsFiltered(hasFilters);
        fetchData({ current: 1 });
    };

    // Reset filter
    const handleResetFilters = () => {
        setFilters({ filterBy: 'kwitansi', dari: null, sampai: null, penjamin: '' });
        setIsFiltered(false);
        fetchData({ current: 1 });
    };

    // Download Excel
    const handleDownload = () => {
        if (!data || data.length === 0) {
            message.warning('Tidak ada data untuk diunduh');
            return;
        }

        const exportData = data.map((item, index) => ({
            'No.': index + 1,
            'No. Kwitansi': item.nomor_kwitansi,
            'Nama Penjamin': item.nama_penjamin,
            'Tanggal Kwitansi': item.tanggal ? dayjs(item.tanggal).format('DD/MM/YYYY') : '',
            'Tanggal Pelayanan': item.tanggal_pelayanan ? dayjs(item.tanggal_pelayanan).format('DD/MM/YYYY') : '',
            'Nominal': item.nominal
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Piutang');

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
            return buf;
        }
        const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
        saveAs(blob, `data_piutang_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
    };

    const columns = [
        { title: 'No. Kwitansi', dataIndex: 'nomor_kwitansi', key: 'nomor_kwitansi', render: (text) => <Text strong>{text}</Text> },
        { title: 'Nama Penjamin', dataIndex: 'nama_penjamin', key: 'nama_penjamin' },
        { title: 'Tanggal Kwitansi', dataIndex: 'tanggal', key: 'tanggal', render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Tanggal Pelayanan', dataIndex: 'tanggal_pelayanan', key: 'tanggal_pelayanan', render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Nominal', dataIndex: 'nominal', key: 'nominal', align: 'right', render: (text) => <Tag color="blue">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(text)}</Tag> },
        {
            title: 'Aksi',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button icon={<PrinterOutlined />} onClick={() => navigate(`/cetak-kwitansi/${record.id}`)}>Cetak</Button>
                    <Popconfirm
                        title="Yakin ingin menghapus kwitansi ini?"
                        onConfirm={async () => {
                            try {
                                await axios.delete(`/api/kwitansi/${record.id}`);
                                message.success('Kwitansi berhasil dihapus');
                                handleSearch();
                            } catch (err) {
                                message.error('Gagal menghapus kwitansi');
                            }
                        }}
                    >
                        <Button type="primary" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <MainLayout>
            <Card title="Data Piutang" extra={
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleDownload}>Download</Button>
                    <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>Reset</Button>
                </Space>
            }>
                <Space size="middle" wrap className="mb-4">
                    <Select value={filters.filterBy} onChange={(value) => setFilters((prev) => ({ ...prev, filterBy: value }))} style={{ width: 150 }}>
                        <Select.Option value="kwitansi">Tanggal Kwitansi</Select.Option>
                        <Select.Option value="pelayanan">Tanggal Pelayanan</Select.Option>
                    </Select>
                    <DatePicker
                        placeholder="Dari"
                        format="DD/MM/YYYY"
                        value={filters.dari ? dayjs(filters.dari) : null}
                        onChange={(date) => setFilters((prev) => ({ ...prev, dari: date }))}
                        suffixIcon={<FilterOutlined />}
                    />
                    <DatePicker
                        placeholder="Sampai"
                        format="DD/MM/YYYY"
                        value={filters.sampai ? dayjs(filters.sampai) : null}
                        onChange={(date) => setFilters((prev) => ({ ...prev, sampai: date }))}
                        suffixIcon={<FilterOutlined />}
                    />
                    <Input
                        placeholder="Cari Penjamin..."
                        value={filters.penjamin}
                        onChange={(e) => setFilters((prev) => ({ ...prev, penjamin: e.target.value }))}
                        onPressEnter={handleSearch}
                        allowClear
                        style={{ width: 200 }}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Cari</Button>
                </Space>

                {isFiltered && <Tag color="orange" closable onClose={handleResetFilters}>Filter Aktif</Tag>}

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            pageSizeOptions: ['10','20','50','100'],
                            showTotal: (total) => `Total ${total} data`
                        }}
                        onChange={(p) => fetchData({ current: p.current, pageSize: p.pageSize })}
                        scroll={{ x: true }}
                        bordered
                    />
                </Spin>
            </Card>
        </MainLayout>
    );
};

export default LihatDataPiutang;
