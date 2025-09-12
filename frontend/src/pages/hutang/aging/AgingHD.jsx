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
    TableRow
} from '@mui/material';
import { Refresh, FileDownload} from '@mui/icons-material';
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
            const response = await api.get(`/api/aging-hd?end_date=${formattedDate}`);

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

    const formatCurrency = (amount) => {
        const n = toNumber(amount);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header utama
        wsData.push([
            "Jenis Kreditur / Vendor",
            "", "", "", // Placeholder untuk < 30 Hari
            "", "", "", // Placeholder untuk 31 - 60 Hari
            "", "", "", // Placeholder untuk 61 - 90 Hari
            "", "", "", // Placeholder untuk > 90 Hari
            "", "", ""  // Placeholder untuk Total
        ]);

        // Header kedua (sub-header)
        const headers = [
            "Jenis Kreditur / Vendor",
            // < 30 Hari
            "DPP", "PPN", "Total",
            // 31 - 60 Hari
            "DPP", "PPN", "Total",
            // 61 - 90 Hari
            "DPP", "PPN", "Total",
            // > 90 Hari
            "DPP", "PPN", "Total",
            // Total
            "DPP", "PPN", "Total"
        ];
        wsData.push(headers);

        // Header ketiga (periode)
        const periodHeaders = [
            "",
            // < 30 Hari
            "< 30 Hari", "< 30 Hari", "< 30 Hari",
            // 31 - 60 Hari
            "31 - 60 Hari", "31 - 60 Hari", "31 - 60 Hari",
            // 61 - 90 Hari
            "61 - 90 Hari", "61 - 90 Hari", "61 - 90 Hari",
            // > 90 Hari
            "> 90 Hari", "> 90 Hari", "> 90 Hari",
            // Total
            "Total", "Total", "Total"
        ];
        wsData.push(periodHeaders);

        // Isi data
        data.data.forEach((jenisGroup) => {
            // Header jenis
            wsData.push([jenisGroup.jenis, ...Array(15).fill("")]);

            // Data vendor
            jenisGroup.vendors.forEach((vendor) => {
                wsData.push([
                    "   " + vendor.nama_vendor,
                    // < 30 Hari
                    vendor.aging.lt30.dpp,
                    vendor.aging.lt30.ppn,
                    vendor.aging.lt30.total,
                    // 31 - 60 Hari
                    vendor.aging.gt30.dpp,
                    vendor.aging.gt30.ppn,
                    vendor.aging.gt30.total,
                    // 61 - 90 Hari
                    vendor.aging.gt60.dpp,
                    vendor.aging.gt60.ppn,
                    vendor.aging.gt60.total,
                    // > 90 Hari
                    vendor.aging.gt90.dpp,
                    vendor.aging.gt90.ppn,
                    vendor.aging.gt90.total,
                    // Total
                    vendor.dpp,
                    vendor.ppn,
                    vendor.total,
                ]);
            });

            // Subtotal per jenis
            wsData.push([
                `Subtotal ${jenisGroup.jenis}`,
                // < 30 Hari
                jenisGroup.subtotal.lt30.dpp,
                jenisGroup.subtotal.lt30.ppn,
                jenisGroup.subtotal.lt30.total,
                // 31 - 60 Hari
                jenisGroup.subtotal.gt30.dpp,
                jenisGroup.subtotal.gt30.ppn,
                jenisGroup.subtotal.gt30.total,
                // 61 - 90 Hari
                jenisGroup.subtotal.gt60.dpp,
                jenisGroup.subtotal.gt60.ppn,
                jenisGroup.subtotal.gt60.total,
                // > 90 Hari
                jenisGroup.subtotal.gt90.dpp,
                jenisGroup.subtotal.gt90.ppn,
                jenisGroup.subtotal.gt90.total,
                // Total
                jenisGroup.subtotal.dpp,
                jenisGroup.subtotal.ppn,
                jenisGroup.subtotal.total,
            ]);

            // Baris kosong sebagai pemisah
            wsData.push(Array(16).fill(""));
        });

        // Grand total
        wsData.push([
            "GRAND TOTAL",
            // < 30 Hari
            data.grandTotal.lt30.dpp,
            data.grandTotal.lt30.ppn,
            data.grandTotal.lt30.total,
            // 31 - 60 Hari
            data.grandTotal.gt30.dpp,
            data.grandTotal.gt30.ppn,
            data.grandTotal.gt30.total,
            // 61 - 90 Hari
            data.grandTotal.gt60.dpp,
            data.grandTotal.gt60.ppn,
            data.grandTotal.gt60.total,
            // > 90 Hari
            data.grandTotal.gt90.dpp,
            data.grandTotal.gt90.ppn,
            data.grandTotal.gt90.total,
            // Total
            data.grandTotal.dpp,
            data.grandTotal.ppn,
            data.grandTotal.total,
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Merge cells untuk header periode
        const mergeCells = [
            // < 30 Hari
            { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
            // 31 - 60 Hari
            { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
            // 61 - 90 Hari
            { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } },
            // > 90 Hari
            { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
            // Total
            { s: { r: 0, c: 13 }, e: { r: 0, c: 15 } }
        ];

        // Set nilai untuk merged cells
        ws['A1'] = { v: "Jenis Kreditur / Vendor", t: 's' };
        ws['B1'] = { v: "< 30 Hari", t: 's' };
        ws['E1'] = { v: "31 - 60 Hari", t: 's' };
        ws['H1'] = { v: "61 - 90 Hari", t: 's' };
        ws['K1'] = { v: "> 90 Hari", t: 's' };
        ws['N1'] = { v: "Total", t: 's' };

        ws['!merges'] = mergeCells;

        // Styling untuk header
        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: "F5F5F5" } }
        };

        // Terapkan styling ke header
        for (let c = 0; c < 16; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
            if (ws[cellAddress]) {
                ws[cellAddress].s = headerStyle;
            }
        }

        for (let c = 0; c < 16; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 1, c });
            if (ws[cellAddress]) {
                ws[cellAddress].s = headerStyle;
            }
        }

        for (let c = 0; c < 16; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 2, c });
            if (ws[cellAddress]) {
                ws[cellAddress].s = headerStyle;
            }
        }

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
                        <TableCell rowSpan={2} align="center">Jenis Kreditur / Vendor</TableCell>

                        {/* 0-30 Hari */}
                        <TableCell colSpan={3} align="center">
                            0 - 30 Hari
                        </TableCell>

                        {/* 31-60 Hari */}
                        <TableCell colSpan={3} align="center">
                            31 - 60 Hari
                        </TableCell>

                        {/* 61-90 Hari */}
                        <TableCell colSpan={3} align="center">
                            61 - 90 Hari
                        </TableCell>

                        {/* >90 Hari */}
                        <TableCell colSpan={3} align="center">
                            > 90 Hari
                        </TableCell>

                        {/* Total */}
                        <TableCell colSpan={3} align="center">
                            Total
                        </TableCell>
                    </TableRow>

                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        {/* Sub-headers untuk setiap periode */}

                        {/* 0-30 Hari */}
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>

                        {/* 31-60 Hari */}
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>

                        {/* 61-90 Hari */}
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>

                        {/* >90 Hari */}
                        <TableCell align="center">DPP</TableCell>
                        <TableCell align="center">PPN</TableCell>
                        <TableCell align="center">Total</TableCell>

                        {/* Total */}
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