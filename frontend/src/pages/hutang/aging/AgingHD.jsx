import React, { useState } from 'react';
import MainLayout from "../../../layouts/MainLayout";
import {
    Box,
    Paper,
    TextField,
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
    Chip,
    Collapse,
    IconButton
} from '@mui/material';
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    Refresh
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import api from '../../../api'; // ✅ PATH YANG BENAR

const AgingHD = () => {
    const [endDate, setEndDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agingData, setAgingData] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Definisikan fungsi agingReport di sini
    const agingReport = {
        getAgingReport: async (endDate) => {
            try {
                const response = await api.get(`/aging-report?end_date=${endDate}`);
                return response.data;
            } catch (error) {
                throw new Error(error.response?.data?.error || 'Gagal mengambil data aging');
            }
        }
    };

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
            const data = await agingReport.getAgingReport(formattedDate);
            setAgingData(data);
        } catch (err) {
            setError('Gagal memproses aging: ' + (err.response?.data?.error || err.message));
            setAgingData(null);
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
                        <Typography variant="h5">
                            Aging Report
                        </Typography>
                        <IconButton onClick={handleRefresh} color="primary">
                            <Refresh />
                        </IconButton>
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

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Paper>

                {hasSearched && !loading && (
                    <AgingResults
                        data={agingData}
                        endDate={endDate}
                        hasData={agingData && agingData.data && agingData.data.length > 0}
                    />
                )}
            </Box>
        </LocalizationProvider>
        </MainLayout>
    );
};

const AgingResults = ({ data, endDate, hasData }) => {
    if (!hasData) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    Tidak ada data aging untuk tanggal {endDate.format('DD/MM/YYYY')}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Hasil Aging per {endDate.format('DD/MM/YYYY')}
            </Typography>

            <AgingTable data={data} />
        </Paper>
    );
};

const AgingTable = ({ data }) => {
    const [openJenis, setOpenJenis] = useState({});

    const handleToggleJenis = (jenis) => {
        setOpenJenis(prev => ({
            ...prev,
            [jenis]: !prev[jenis]
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell width="30%">Jenis Kreditur / Vendor</TableCell>
                        <TableCell align="right" width="14%">0-30 Hari</TableCell>
                        <TableCell align="right" width="14%">31-60 Hari</TableCell>
                        <TableCell align="right" width="14%">61-90 Hari</TableCell>
                        <TableCell align="right" width="14%">>90 Hari</TableCell>
                        <TableCell align="right" width="14%">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.data.map((jenisGroup, index) => (
                        <React.Fragment key={jenisGroup.jenis}>
                            {/* Jenis Kreditur Row */}
                            <TableRow sx={{ backgroundColor: '#e8f5e8' }}>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleToggleJenis(jenisGroup.jenis)}
                                    >
                                        {openJenis[jenisGroup.jenis] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                    </IconButton>
                                    <Chip
                                        label={jenisGroup.jenis}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                    />
                                </TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.lt30.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt30.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt60.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal.gt90.dpp)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(jenisGroup.subtotal.dpp)}
                                </TableCell>
                            </TableRow>

                            {/* Vendor Rows - Collapsible */}
                            <TableRow>
                                <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                    <Collapse in={openJenis[jenisGroup.jenis]} timeout="auto" unmountOnExit>
                                        <Box sx={{ backgroundColor: '#fafafa' }}>
                                            {jenisGroup.vendors.map((vendor, vendorIndex) => (
                                                <TableRow key={vendorIndex} sx={{ '&:last-child td': { borderBottom: '1px solid #e0e0e0' } }}>
                                                    <TableCell sx={{ pl: 6 }}>{vendor.nama_vendor}</TableCell>
                                                    <TableCell align="right">{formatCurrency(vendor.aging.lt30.dpp)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(vendor.aging.gt30.dpp)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(vendor.aging.gt60.dpp)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(vendor.aging.gt90.dpp)}</TableCell>
                                                    <TableCell align="right">
                                                        {formatCurrency(
                                                            vendor.aging.lt30.dpp +
                                                            vendor.aging.gt30.dpp +
                                                            vendor.aging.gt60.dpp +
                                                            vendor.aging.gt90.dpp
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </Box>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}

                    {/* Grand Total Row */}
                    {data.grandTotal && (
                        <TableRow sx={{ backgroundColor: '#d4edda', fontWeight: 'bold' }}>
                            <TableCell>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    GRAND TOTAL
                                </Typography>
                            </TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.lt30.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.gt30.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.gt60.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.gt90.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.dpp)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AgingHD;