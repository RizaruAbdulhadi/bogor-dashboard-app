import React, { useState, useEffect } from 'react';
import MainLayout from "../../../layouts/MainLayout";
import {
    Box,
    Paper,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    IconButton
} from '@mui/material';
import { Refresh, FileDownload, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import * as XLSX from "xlsx";
import api from '../../../api';

/* =========================
   Utils & Grouping
   ========================= */
const emptyGrouped = () => ({
    data: [],
    grandTotal: {
        dpp: 0, ppn: 0, total: 0,
        lt30: { dpp: 0, ppn: 0, total: 0 },
        gt30: { dpp: 0, ppn: 0, total: 0 },
        gt60: { dpp: 0, ppn: 0, total: 0 },
        gt90: { dpp: 0, ppn: 0, total: 0 }
    }
});

const toNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v.replace(/[^\d.-]/g, '')) || 0;
    return 0;
};

const pickAgingDate = (row) =>
    row.tanggal_jatuh_tempo ||
    row.jatuh_tempo ||
    row.tanggal_faktur ||
    row.tgl_faktur ||
    row.tanggal_penerimaan ||
    null;

const pickVendorName = (row) =>
    row.vendor?.nama ??
    row.nama_vendor ??
    row.vendor_name ??
    row.vendor ??
    'Unknown';

const pickJenis = (row) =>
    row.kreditur?.jenis ??
    row.jenis_kreditur ??
    row.jenis ??
    'Lainnya';

const segTemplate = () => ({ dpp: 0, ppn: 0, total: 0 });
const ensureJenisBucket = (store, jenis) => {
    if (!store[jenis]) {
        store[jenis] = {
            vendors: {},
            subtotal: {
                dpp: 0, ppn: 0, total: 0,
                lt30: segTemplate(),
                gt30: segTemplate(),
                gt60: segTemplate(),
                gt90: segTemplate()
            }
        };
    }
};
const ensureVendorBucket = (jenisBucket, vendor) => {
    if (!jenisBucket.vendors[vendor]) {
        jenisBucket.vendors[vendor] = {
            nama_vendor: vendor,
            aging: {
                lt30: segTemplate(),
                gt30: segTemplate(),
                gt60: segTemplate(),
                gt90: segTemplate()
            },
            total: 0,
            dpp: 0,
            ppn: 0
        };
    }
};
const addAmounts = (target, dpp, ppn) => {
    target.dpp += dpp;
    target.ppn += ppn;
    target.total += (dpp + ppn);
};

const groupAgingDataFrontend = (rawData, endDateStr) => {
    const endDate = dayjs(endDateStr).startOf('day');
    const groupedJenis = {};
    const grandTotal = {
        dpp: 0, ppn: 0, total: 0,
        lt30: segTemplate(),
        gt30: segTemplate(),
        gt60: segTemplate(),
        gt90: segTemplate()
    };

    for (const row of rawData) {
        const jenis = pickJenis(row) || 'Lainnya';
        const vendor = pickVendorName(row) || 'Unknown';
        const dpp = toNumber(row.dpp);
        const ppn = toNumber(row.ppn);

        let days = 0;
        const dateRaw = pickAgingDate(row);
        if (dateRaw) {
            const d = dayjs(dateRaw).startOf('day');
            if (d.isValid()) {
                days = Math.max(0, endDate.diff(d, 'day'));
            }
        }

        ensureJenisBucket(groupedJenis, jenis);
        const jenisBucket = groupedJenis[jenis];
        ensureVendorBucket(jenisBucket, vendor);
        const vendorBucket = jenisBucket.vendors[vendor];

        let segment = null;
        if (days <= 30) segment = 'lt30';
        else if (days <= 60) segment = 'gt30';
        else if (days <= 90) segment = 'gt60';
        else segment = 'gt90';

        addAmounts(vendorBucket.aging[segment], dpp, ppn);
        addAmounts(jenisBucket.subtotal[segment], dpp, ppn);
        addAmounts(grandTotal[segment], dpp, ppn);

        vendorBucket.dpp += dpp;
        vendorBucket.ppn += ppn;
        vendorBucket.total += (dpp + ppn);

        jenisBucket.subtotal.dpp += dpp;
        jenisBucket.subtotal.ppn += ppn;
        jenisBucket.subtotal.total += (dpp + ppn);

        grandTotal.dpp += dpp;
        grandTotal.ppn += ppn;
        grandTotal.total += (dpp + ppn);
    }

    const result = Object.entries(groupedJenis).map(([jenis, { vendors, subtotal }]) => ({
        jenis,
        vendors: Object.values(vendors),
        subtotal
    }));

    return { data: result, grandTotal };
};

/* =========================
   Main Component
   ========================= */
const AgingHD = () => {
    const [endDate, setEndDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agingData, setAgingData] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleProcessAging = async () => {
        if (!endDate) {
            setError('Tanggal akhir harus diisi');
            return;
        }

        setLoading(true);
        setError('');
        setHasSearched(true);

        try {
            const formattedDate = endDate.format('YYYY-MM-DD');
            const response = await api.get(`/aging-hd?end_date=${formattedDate}`);

            if (Array.isArray(response.data)) {
                const groupedData = groupAgingDataFrontend(response.data, formattedDate);
                setAgingData(groupedData);
            } else if (response.data && Array.isArray(response.data.data)) {
                setAgingData(response.data);
            } else {
                setAgingData(emptyGrouped());
            }
        } catch (err) {
            setError('Gagal memproses aging: ' + (err.response?.data?.error || err.message));
            setAgingData(emptyGrouped());
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setAgingData(null);
        setHasSearched(false);
        setError('');
    };

    return (
        <MainLayout>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ p: 3 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Aging Report</Typography>
                            <Button onClick={handleRefresh} startIcon={<Refresh />} color="primary">
                                Refresh
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                            <DatePicker
                                label="Tanggal Akhir Aging"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                format="DD/MM/YYYY"
                                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleProcessAging}
                                disabled={loading}
                                sx={{ minWidth: 140, height: 40 }}
                                startIcon={loading ? <CircularProgress size={16} /> : null}
                            >
                                {loading ? 'Memproses...' : 'Proses Aging'}
                            </Button>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}
                    </Paper>

                    {hasSearched && !loading && (
                        <AgingResults data={agingData} endDate={endDate} />
                    )}
                </Box>
            </LocalizationProvider>
        </MainLayout>
    );
};

/* =========================
   Table Rendering + Export
   ========================= */
const AgingResults = ({ data, endDate }) => {
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    Tidak ada data aging untuk tanggal {endDate.format('DD/MM/YYYY')}
                </Typography>
            </Paper>
        );
    }

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header
        wsData.push([
            "Jenis Kreditur / Vendor",
            "0–30 Hari (DPP)", "0–30 Hari (PPN)", "0–30 Hari (Total)",
            "31–60 Hari (DPP)", "31–60 Hari (PPN)", "31–60 Hari (Total)",
            "61–90 Hari (DPP)", "61–90 Hari (PPN)", "61–90 Hari (Total)",
            ">90 Hari (DPP)", ">90 Hari (PPN)", ">90 Hari (Total)",
            "Total DPP", "Total PPN", "Grand Total"
        ]);

        // Isi data
        data.data.forEach((jenisGroup) => {
            wsData.push([jenisGroup.jenis]); // header jenis

            jenisGroup.vendors.forEach((vendor) => {
                wsData.push([
                    "   " + vendor.nama_vendor,
                    vendor.aging.lt30.dpp,
                    vendor.aging.lt30.ppn,
                    vendor.aging.lt30.total,
                    vendor.aging.gt30.dpp,
                    vendor.aging.gt30.ppn,
                    vendor.aging.gt30.total,
                    vendor.aging.gt60.dpp,
                    vendor.aging.gt60.ppn,
                    vendor.aging.gt60.total,
                    vendor.aging.gt90.dpp,
                    vendor.aging.gt90.ppn,
                    vendor.aging.gt90.total,
                    vendor.dpp,
                    vendor.ppn,
                    vendor.total,
                ]);
            });

            // Subtotal per jenis
            wsData.push([
                `Subtotal ${jenisGroup.jenis}`,
                jenisGroup.subtotal.lt30.dpp,
                jenisGroup.subtotal.lt30.ppn,
                jenisGroup.subtotal.lt30.total,
                jenisGroup.subtotal.gt30.dpp,
                jenisGroup.subtotal.gt30.ppn,
                jenisGroup.subtotal.gt30.total,
                jenisGroup.subtotal.gt60.dpp,
                jenisGroup.subtotal.gt60.ppn,
                jenisGroup.subtotal.gt60.total,
                jenisGroup.subtotal.gt90.dpp,
                jenisGroup.subtotal.gt90.ppn,
                jenisGroup.subtotal.gt90.total,
                jenisGroup.subtotal.dpp,
                jenisGroup.subtotal.ppn,
                jenisGroup.subtotal.total,
            ]);
        });

        // Grand total
        wsData.push([
            "GRAND TOTAL",
            data.grandTotal.lt30.dpp,
            data.grandTotal.lt30.ppn,
            data.grandTotal.lt30.total,
            data.grandTotal.gt30.dpp,
            data.grandTotal.gt30.ppn,
            data.grandTotal.gt30.total,
            data.grandTotal.gt60.dpp,
            data.grandTotal.gt60.ppn,
            data.grandTotal.gt60.total,
            data.grandTotal.gt90.dpp,
            data.grandTotal.gt90.ppn,
            data.grandTotal.gt90.total,
            data.grandTotal.dpp,
            data.grandTotal.ppn,
            data.grandTotal.total,
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Aging Report");

        XLSX.writeFile(wb, `Aging_Report_${endDate.format("YYYYMMDD")}.xlsx`);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Hasil Aging per {endDate.format('DD/MM/YYYY')}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={handleExportExcel}
                >
                    Export Excel
                </Button>
            </Box>
            <AgingTable data={data} />
        </Paper>
    );
};

const Row = ({ vendor, level = 0 }) => {
    const [open, setOpen] = React.useState(false);
    const formatCurrency = (amount) => {
        const n = toNumber(amount);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);
    };

    return (
        <React.Fragment>
            <TableRow>
                <TableCell sx={{ pl: level * 4 }}>
                    {vendor.nama_vendor}
                </TableCell>
                {/* 0-30 Hari */}
                <TableCell align="right">{formatCurrency(vendor.aging.lt30.dpp)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.lt30.ppn)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.lt30.total)}</TableCell>
                {/* 31-60 Hari */}
                <TableCell align="right">{formatCurrency(vendor.aging.gt30.dpp)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.gt30.ppn)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.gt30.total)}</TableCell>
                {/* 61-90 Hari */}
                <TableCell align="right">{formatCurrency(vendor.aging.gt60.dpp)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.gt60.ppn)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.gt60.total)}</TableCell>
                {/* >90 Hari */}
                <TableCell align="right">{formatCurrency(vendor.aging.gt90.dpp)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.gt90.ppn)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.aging.gt90.total)}</TableCell>
                {/* Total */}
                <TableCell align="right">{formatCurrency(vendor.dpp)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.ppn)}</TableCell>
                <TableCell align="right">{formatCurrency(vendor.total)}</TableCell>
            </TableRow>
        </React.Fragment>
    );
};

const AgingTable = ({ data }) => {
    const formatCurrency = (amount) => {
        const n = toNumber(amount);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);
    };

    return (
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell rowSpan={2}>Jenis Kreditur / Vendor</TableCell>
                        <TableCell colSpan={3} align="center">0–30 Hari</TableCell>
                        <TableCell colSpan={3} align="center">31–60 Hari</TableCell>
                        <TableCell colSpan={3} align="center">61–90 Hari</TableCell>
                        <TableCell colSpan={3} align="center">&gt;90 Hari</TableCell>
                        <TableCell colSpan={3} align="center">Total</TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        {/* Sub-headers for each period */}
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.data.map((jenisGroup, index) => (
                        <React.Fragment key={index}>
                            {/* Header Jenis */}
                            <TableRow sx={{ backgroundColor: '#e8f5e8', fontWeight: 'bold' }}>
                                <TableCell colSpan={16}>{jenisGroup.jenis}</TableCell>
                            </TableRow>

                            {/* Vendors */}
                            {jenisGroup.vendors.map((vendor, vIndex) => (
                                <Row key={vIndex} vendor={vendor} level={1} />
                            ))}

                            {/* Subtotal per Jenis */}
                            <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                <TableCell>Subtotal {jenisGroup.jenis}</TableCell>
                                {/* 0-30 Hari */}
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.lt30.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.lt30.ppn)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.lt30.total)}</TableCell>
                                {/* 31-60 Hari */}
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt30.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt30.ppn)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt30.total)}</TableCell>
                                {/* 61-90 Hari */}
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt60.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt60.ppn)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt60.total)}</TableCell>
                                {/* >90 Hari */}
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt90.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt90.ppn)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt90.total)}</TableCell>
                                {/* Total */}
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.ppn)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.total)}</TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}

                    {/* Grand Total */}
                    <TableRow sx={{ backgroundColor: '#d4edda', fontWeight: 'bold' }}>
                        <TableCell>GRAND TOTAL</TableCell>
                        {/* 0-30 Hari */}
                        <TableCell align="right">{formatCurrency(data.grandTotal.lt30.dpp)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.lt30.ppn)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.lt30.total)}</TableCell>
                        {/* 31-60 Hari */}
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt30.dpp)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt30.ppn)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt30.total)}</TableCell>
                        {/* 61-90 Hari */}
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt60.dpp)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt60.ppn)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt60.total)}</TableCell>
                        {/* >90 Hari */}
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt90.dpp)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt90.ppn)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.gt90.total)}</TableCell>
                        {/* Total */}
                        <TableCell align="right">{formatCurrency(data.grandTotal.dpp)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.ppn)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.grandTotal.total)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AgingHD;