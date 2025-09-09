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
import api from '../../../api';

const AgingHD = () => {
    const [endDate, setEndDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agingData, setAgingData] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Debug useEffect
    useEffect(() => {
        console.log('agingData changed:', agingData);
    }, [agingData]);

    useEffect(() => {
        console.log('loading changed:', loading);
    }, [loading]);

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
            console.log('Fetching data for date:', formattedDate);

            const response = await api.get(`/aging-hd?end_date=${formattedDate}`);
            console.log('API Response:', response.data);

            // Handle berbagai format response
            if (Array.isArray(response.data)) {
                // Response adalah array langsung
                setAgingData({
                    data: response.data,
                    grandTotal: calculateGrandTotal(response.data)
                });
            } else if (response.data && Array.isArray(response.data.data)) {
                // Response adalah { data: [], grandTotal: {} }
                setAgingData(response.data);
            } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Response adalah { success: true, data: [], grandTotal: {} }
                setAgingData({
                    data: response.data.data,
                    grandTotal: response.data.grandTotal
                });
            } else {
                console.warn('Unexpected response format:', response.data);
                setAgingData({
                    data: [],
                    grandTotal: {
                        dpp: 0,
                        ppn: 0,
                        lt30: { dpp: 0, ppn: 0 },
                        gt30: { dpp: 0, ppn: 0 },
                        gt60: { dpp: 0, ppn: 0 },
                        gt90: { dpp: 0, ppn: 0 }
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching aging data:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Gagal mengambil data aging';
            setError('Gagal memproses aging: ' + errorMessage);
            setAgingData({
                data: [],
                grandTotal: {
                    dpp: 0,
                    ppn: 0,
                    lt30: { dpp: 0, ppn: 0 },
                    gt30: { dpp: 0, ppn: 0 },
                    gt60: { dpp: 0, ppn: 0 },
                    gt90: { dpp: 0, ppn: 0 }
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateGrandTotal = (data) => {
        const grandTotal = {
            dpp: 0,
            ppn: 0,
            lt30: { dpp: 0, ppn: 0 },
            gt30: { dpp: 0, ppn: 0 },
            gt60: { dpp: 0, ppn: 0 },
            gt90: { dpp: 0, ppn: 0 }
        };

        data.forEach(jenisGroup => {
            if (jenisGroup.subtotal) {
                grandTotal.dpp += jenisGroup.subtotal.dpp || 0;
                grandTotal.ppn += jenisGroup.subtotal.ppn || 0;
                grandTotal.lt30.dpp += jenisGroup.subtotal.lt30?.dpp || 0;
                grandTotal.lt30.ppn += jenisGroup.subtotal.lt30?.ppn || 0;
                grandTotal.gt30.dpp += jenisGroup.subtotal.gt30?.dpp || 0;
                grandTotal.gt30.ppn += jenisGroup.subtotal.gt30?.ppn || 0;
                grandTotal.gt60.dpp += jenisGroup.subtotal.gt60?.dpp || 0;
                grandTotal.gt60.ppn += jenisGroup.subtotal.gt60?.ppn || 0;
                grandTotal.gt90.dpp += jenisGroup.subtotal.gt90?.dpp || 0;
                grandTotal.gt90.ppn += jenisGroup.subtotal.gt90?.ppn || 0;
            }
        });

        return grandTotal;
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
                        />
                    )}
                </Box>
            </LocalizationProvider>
        </MainLayout>
    );
};

const AgingResults = ({ data, endDate }) => {
    console.log('AgingResults data:', data);

    // Check if we have valid data
    const hasValidData = data &&
        Array.isArray(data.data) &&
        data.data.length > 0 &&
        data.data.some(item => item.vendors && Object.keys(item.vendors).length > 0);

    if (!hasValidData) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    Tidak ada data aging untuk tanggal {endDate.format('DD/MM/YYYY')}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Silakan coba dengan tanggal yang berbeda.
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
        if (!amount || isNaN(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!data || !data.data || !Array.isArray(data.data)) {
        return (
            <Typography variant="body1" color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                Data tidak tersedia atau format tidak valid
            </Typography>
        );
    }

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
                        <React.Fragment key={jenisGroup.jenis || index}>
                            {/* Jenis Kreditur Row */}
                            <TableRow sx={{ backgroundColor: '#e8f5e8' }}>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleToggleJenis(jenisGroup.jenis)}
                                        disabled={!jenisGroup.vendors || Object.keys(jenisGroup.vendors).length === 0}
                                    >
                                        {jenisGroup.vendors && Object.keys(jenisGroup.vendors).length > 0 ? (
                                            openJenis[jenisGroup.jenis] ? <KeyboardArrowUp /> : <KeyboardArrowDown />
                                        ) : null}
                                    </IconButton>
                                    <Chip
                                        label={jenisGroup.jenis || 'Tidak Diketahui'}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                    />
                                </TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal?.lt30?.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal?.gt30?.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal?.gt60?.dpp)}</TableCell>
                                <TableCell align="right">{formatCurrency(jenisGroup.subtotal?.gt90?.dpp)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(jenisGroup.subtotal?.dpp)}
                                </TableCell>
                            </TableRow>

                            {/* Vendor Rows - Collapsible */}
                            {jenisGroup.vendors && Object.keys(jenisGroup.vendors).length > 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                        <Collapse in={openJenis[jenisGroup.jenis]} timeout="auto" unmountOnExit>
                                            <Box sx={{ backgroundColor: '#fafafa' }}>
                                                {Object.values(jenisGroup.vendors).map((vendor, vendorIndex) => (
                                                    <TableRow key={vendorIndex} sx={{ '&:last-child td': { borderBottom: '1px solid #e0e0e0' } }}>
                                                        <TableCell sx={{ pl: 6 }}>{vendor.nama_vendor || 'Unknown Vendor'}</TableCell>
                                                        <TableCell align="right">{formatCurrency(vendor.aging?.lt30?.dpp)}</TableCell>
                                                        <TableCell align="right">{formatCurrency(vendor.aging?.gt30?.dpp)}</TableCell>
                                                        <TableCell align="right">{formatCurrency(vendor.aging?.gt60?.dpp)}</TableCell>
                                                        <TableCell align="right">{formatCurrency(vendor.aging?.gt90?.dpp)}</TableCell>
                                                        <TableCell align="right">
                                                            {formatCurrency(
                                                                (vendor.aging?.lt30?.dpp || 0) +
                                                                (vendor.aging?.gt30?.dpp || 0) +
                                                                (vendor.aging?.gt60?.dpp || 0) +
                                                                (vendor.aging?.gt90?.dpp || 0)
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            )}
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
                            <TableCell align="right">{formatCurrency(data.grandTotal.lt30?.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.gt30?.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.gt60?.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.gt90?.dpp)}</TableCell>
                            <TableCell align="right">{formatCurrency(data.grandTotal.dpp)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AgingHD;