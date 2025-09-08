import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../../layouts/MainLayout";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Typography,
    Button,
    Box,
    TableFooter,
    Collapse,
    IconButton,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
    "&:last-child td, &:last-child th": { border: 0 },
}));

const HeaderTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: "bold",
}));

const SubtotalRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: theme.palette.grey[200],
    "& td": {
        fontSize: "1rem",
        fontWeight: "bold",
        borderTop: `2px solid ${theme.palette.grey[400]}`
    },
}));

const GrandTotalRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: theme.palette.primary.light,
    "& td": {
        fontSize: "1rem",
        fontWeight: "bold",
        borderTop: `2px solid ${theme.palette.primary.dark}`
    },
}));

// Komponen untuk baris vendor group dengan expand/collapse
const VendorGroupRow = ({ vendorGroup, isExpanded, toggleExpand }) => {
    return (
        <>
            <TableRow>
                <TableCell>
                    <IconButton size="small" onClick={() => toggleExpand(vendorGroup.vendorKey)}>
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{vendorGroup.kode_vendor}</TableCell>
                <TableCell>{vendorGroup.nama_vendor}</TableCell>
                <TableCell>{vendorGroup.jenis}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.dpp)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.ppn)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.lt30.dpp)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.lt30.ppn)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.gt30.dpp)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.gt30.ppn)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.gt60.dpp)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.gt60.ppn)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.gt90.dpp)}</TableCell>
                <TableCell align="right">{formatNumber(vendorGroup.subtotal.gt90.ppn)}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={14}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Detail Faktur - {vendorGroup.nama_vendor}
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No. Faktur</TableCell>
                                        <TableCell>Tanggal Faktur</TableCell>
                                        <TableCell>Tanggal Penerimaan</TableCell>
                                        <TableCell>No. Penerimaan</TableCell>
                                        <TableCell>DPP</TableCell>
                                        <TableCell>PPN</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Aging</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {vendorGroup.items.map((item, index) => {
                                        const today = new Date();
                                        const tanggalFaktur = new Date(item.tanggal_faktur);
                                        const diffDays = Math.floor((today - tanggalFaktur) / (1000 * 60 * 60 * 24));
                                        let agingCategory = "";

                                        if (diffDays <= 30) agingCategory = "<30 Hari";
                                        else if (diffDays <= 60) agingCategory = ">30 Hari";
                                        else if (diffDays <= 90) agingCategory = ">60 Hari";
                                        else agingCategory = ">90 Hari";

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{item.no_faktur}</TableCell>
                                                <TableCell>{item.tanggal_faktur}</TableCell>
                                                <TableCell>{item.tanggal_penerimaan}</TableCell>
                                                <TableCell>{item.nomor_penerimaan}</TableCell>
                                                <TableCell align="right">{formatNumber(item.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(item.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(item.total)}</TableCell>
                                                <TableCell>{agingCategory}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

// Format angka
const formatNumber = (num) =>
    Number(num || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 });

// Fungsi untuk mengonversi Date object ke format YYYY-MM-DD
const formatDateToAPI = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Fungsi untuk mengelompokkan data berdasarkan jenis dan vendor
const groupDataByJenisAndVendor = (fakturData) => {
    const grouped = {};

    // Extract unique jenis values for filter options
    const jenisSet = new Set();

    fakturData.forEach((item) => {
        const jenis = item.jenis || "LAINNYA";
        jenisSet.add(jenis);

        const vendorKey = `${item.kode_vendor}-${item.nama_vendor}`;

        if (!grouped[jenis]) {
            grouped[jenis] = {
                jenis,
                vendorGroups: {},
                subtotal: {
                    dpp: 0,
                    ppn: 0,
                    lt30: { dpp: 0, ppn: 0 },
                    gt30: { dpp: 0, ppn: 0 },
                    gt60: { dpp: 0, ppn: 0 },
                    gt90: { dpp: 0, ppn: 0 },
                },
            };
        }

        if (!grouped[jenis].vendorGroups[vendorKey]) {
            grouped[jenis].vendorGroups[vendorKey] = {
                vendorKey,
                kode_vendor: item.kode_vendor,
                nama_vendor: item.nama_vendor,
                jenis: jenis,
                items: [],
                subtotal: {
                    dpp: 0,
                    ppn: 0,
                    lt30: { dpp: 0, ppn: 0 },
                    gt30: { dpp: 0, ppn: 0 },
                    gt60: { dpp: 0, ppn: 0 },
                    gt90: { dpp: 0, ppn: 0 },
                },
            };
        }

        const today = new Date();
        const tanggalFaktur = new Date(item.tanggal_faktur);
        const diffDays = Math.floor((today - tanggalFaktur) / (1000 * 60 * 60 * 24));

        const aging = {
            lt30: { dpp: 0, ppn: 0 },
            gt30: { dpp: 0, ppn: 0 },
            gt60: { dpp: 0, ppn: 0 },
            gt90: { dpp: 0, ppn: 0 },
        };

        if (diffDays <= 30) {
            aging.lt30.dpp = Number(item.dpp) || 0;
            aging.lt30.ppn = Number(item.ppn) || 0;
        } else if (diffDays <= 60) {
            aging.gt30.dpp = Number(item.dpp) || 0;
            aging.gt30.ppn = Number(item.ppn) || 0;
        } else if (diffDays <= 90) {
            aging.gt60.dpp = Number(item.dpp) || 0;
            aging.gt60.ppn = Number(item.ppn) || 0;
        } else {
            aging.gt90.dpp = Number(item.dpp) || 0;
            aging.gt90.ppn = Number(item.ppn) || 0;
        }

        // Add item to vendor group
        grouped[jenis].vendorGroups[vendorKey].items.push(item);

        // Update vendor subtotal
        const vendorSub = grouped[jenis].vendorGroups[vendorKey].subtotal;
        vendorSub.dpp += Number(item.dpp) || 0;
        vendorSub.ppn += Number(item.ppn) || 0;
        vendorSub.lt30.dpp += aging.lt30.dpp;
        vendorSub.lt30.ppn += aging.lt30.ppn;
        vendorSub.gt30.dpp += aging.gt30.dpp;
        vendorSub.gt30.ppn += aging.gt30.ppn;
        vendorSub.gt60.dpp += aging.gt60.dpp;
        vendorSub.gt60.ppn += aging.gt60.ppn;
        vendorSub.gt90.dpp += aging.gt90.dpp;
        vendorSub.gt90.ppn += aging.gt90.ppn;

        // Update group subtotal
        const groupSub = grouped[jenis].subtotal;
        groupSub.dpp += Number(item.dpp) || 0;
        groupSub.ppn += Number(item.ppn) || 0;
        groupSub.lt30.dpp += aging.lt30.dpp;
        groupSub.lt30.ppn += aging.lt30.ppn;
        groupSub.gt30.dpp += aging.gt30.dpp;
        groupSub.gt30.ppn += aging.gt30.ppn;
        groupSub.gt60.dpp += aging.gt60.dpp;
        groupSub.gt60.ppn += aging.gt60.ppn;
        groupSub.gt90.dpp += aging.gt90.dpp;
        groupSub.gt90.ppn += aging.gt90.ppn;
    });

    const grandTotal = {
        dpp: 0,
        ppn: 0,
        lt30: { dpp: 0, ppn: 0 },
        gt30: { dpp: 0, ppn: 0 },
        gt60: { dpp: 0, ppn: 0 },
        gt90: { dpp: 0, ppn: 0 },
    };

    // Convert vendorGroups to array and calculate grand total
    const groupedArray = Object.values(grouped);

    groupedArray.forEach((group) => {
        group.vendorGroups = Object.values(group.vendorGroups);

        grandTotal.dpp += group.subtotal.dpp;
        grandTotal.ppn += group.subtotal.ppn;
        grandTotal.lt30.dpp += group.subtotal.lt30.dpp;
        grandTotal.lt30.ppn += group.subtotal.lt30.ppn;
        grandTotal.gt30.dpp += group.subtotal.gt30.dpp;
        grandTotal.gt30.ppn += group.subtotal.gt30.ppn;
        grandTotal.gt60.dpp += group.subtotal.gt60.dpp;
        grandTotal.gt60.ppn += group.subtotal.gt60.ppn;
        grandTotal.gt90.dpp += group.subtotal.gt90.dpp;
        grandTotal.gt90.ppn += group.subtotal.gt90.ppn;
    });

    return { groupedData: groupedArray, grandTotal, jenisOptions: ["ALL", ...Array.from(jenisSet).sort()] };
};

const AgingHD = () => {
    const [allData, setAllData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [groupedData, setGroupedData] = useState([]);
    const [grandTotal, setGrandTotal] = useState({
        dpp: 0,
        ppn: 0,
        lt30: { dpp: 0, ppn: 0 },
        gt30: { dpp: 0, ppn: 0 },
        gt60: { dpp: 0, ppn: 0 },
        gt90: { dpp: 0, ppn: 0 },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [expandedRows, setExpandedRows] = useState({});

    // State untuk filter
    const [filterParams, setFilterParams] = useState({
        startDate: "",
        endDate: "",
        jenis: "ALL"
    });
    const [jenisOptions, setJenisOptions] = useState([]);

    const toggleExpand = (vendorKey) => {
        setExpandedRows(prev => ({
            ...prev,
            [vendorKey]: !prev[vendorKey]
        }));
    };

    const handleFilterChange = (field, value) => {
        setFilterParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilter = () => {
        // Filter data berdasarkan parameter yang dipilih
        let filtered = [...allData];

        // Filter berdasarkan jenis
        if (filterParams.jenis && filterParams.jenis !== "ALL") {
            filtered = filtered.filter(item => item.jenis === filterParams.jenis);
        }

        // Filter berdasarkan tanggal
        if (filterParams.startDate) {
            const startDate = new Date(filterParams.startDate);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.tanggal_penerimaan || item.tanggal_faktur);
                return itemDate >= startDate;
            });
        }

        if (filterParams.endDate) {
            const endDate = new Date(filterParams.endDate);
            endDate.setHours(23, 59, 59, 999); // Sampai akhir hari
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.tanggal_penerimaan || item.tanggal_faktur);
                return itemDate <= endDate;
            });
        }

        setFilteredData(filtered);

        // Kelompokkan data yang sudah difilter
        const { groupedData, grandTotal } = groupDataByJenisAndVendor(filtered);
        setGroupedData(groupedData);
        setGrandTotal(grandTotal);
    };

    const resetFilter = () => {
        setFilterParams({
            startDate: "",
            endDate: "",
            jenis: "ALL"
        });

        // Reset ke data semua
        setFilteredData(allData);

        // Kelompokkan data semua
        const { groupedData, grandTotal } = groupDataByJenisAndVendor(allData);
        setGroupedData(groupedData);
        setGrandTotal(grandTotal);
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setErrorMsg("");

            // Fetch semua data tanpa filter
            const fakturRes = await axios.get(`${API_URL}/api/aging-hd`);

            setAllData(fakturRes.data);
            setFilteredData(fakturRes.data);

            // Kelompokkan data
            const { groupedData, grandTotal, jenisOptions } = groupDataByJenisAndVendor(fakturRes.data);
            setGroupedData(groupedData);
            setGrandTotal(grandTotal);
            setJenisOptions(jenisOptions);
        } catch (err) {
            console.error("Error fetching data:", err);
            setErrorMsg("Gagal memuat data Aging HD. Periksa koneksi API.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Export Excel
    const exportToExcel = () => {
        const excelData = [];

        // Header dengan info filter
        excelData.push(["Laporan Aging Hutang Dagang"]);
        if (filterParams.startDate || filterParams.endDate) {
            excelData.push([
                `Periode: ${filterParams.startDate || 'Awal'} - ${filterParams.endDate || 'Akhir'}`
            ]);
        }
        if (filterParams.jenis && filterParams.jenis !== "ALL") {
            excelData.push([`Jenis: ${filterParams.jenis}`]);
        }
        excelData.push([]);

        // Header tabel
        excelData.push([
            "Jenis",
            "Kode Vendor",
            "Nama Vendor",
            "Saldo Akhir DPP",
            "Saldo Akhir PPN",
            "<30 Hari DPP",
            "<30 Hari PPN",
            ">30 Hari DPP",
            ">30 Hari PPN",
            ">60 Hari DPP",
            ">60 Hari PPN",
            ">90 Hari DPP",
            ">90 Hari PPN",
        ]);

        // Data per vendor (grouped)
        groupedData.forEach((group) => {
            group.vendorGroups.forEach((vendorGroup) => {
                excelData.push([
                    group.jenis,
                    vendorGroup.kode_vendor,
                    vendorGroup.nama_vendor,
                    vendorGroup.subtotal.dpp,
                    vendorGroup.subtotal.ppn,
                    vendorGroup.subtotal.lt30.dpp,
                    vendorGroup.subtotal.lt30.ppn,
                    vendorGroup.subtotal.gt30.dpp,
                    vendorGroup.subtotal.gt30.ppn,
                    vendorGroup.subtotal.gt60.dpp,
                    vendorGroup.subtotal.gt60.ppn,
                    vendorGroup.subtotal.gt90.dpp,
                    vendorGroup.subtotal.gt90.ppn,
                ]);
            });
        });

        // Subtotal per group (di bagian bawah)
        groupedData.forEach((group) => {
            excelData.push([
                `Subtotal ${group.jenis}`,
                "",
                "",
                group.subtotal.dpp,
                group.subtotal.ppn,
                group.subtotal.lt30.dpp,
                group.subtotal.lt30.ppn,
                group.subtotal.gt30.dpp,
                group.subtotal.gt30.ppn,
                group.subtotal.gt60.dpp,
                group.subtotal.gt60.ppn,
                group.subtotal.gt90.dpp,
                group.subtotal.gt90.ppn,
            ]);
        });

        // Grand Total
        excelData.push([
            "GRAND TOTAL",
            "",
            "",
            grandTotal.dpp,
            grandTotal.ppn,
            grandTotal.lt30.dpp,
            grandTotal.lt30.ppn,
            grandTotal.gt30.dpp,
            grandTotal.gt30.ppn,
            grandTotal.gt60.dpp,
            grandTotal.gt60.ppn,
            grandTotal.gt90.dpp,
            grandTotal.gt90.ppn,
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws["!cols"] = excelData[0].map((_, i) => ({
            wch: Math.max(...excelData.map((row) => String(row[i] || "").length + 2)),
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AgingHD");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        const fileName = `Laporan_Aging_HD_${filterParams.startDate || 'all'}_${filterParams.endDate || 'all'}.xlsx`;
        saveAs(dataBlob, fileName);
    };

    if (isLoading) {
        return (
            <MainLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading data...</Typography>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h4" gutterBottom>Laporan Aging Hutang Dagang</Typography>
                    <Button variant="contained" color="primary" onClick={exportToExcel}>Export to Excel</Button>
                </Box>

                {/* Filter Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Filter Data</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Tanggal Mulai Penerimaan"
                                type="date"
                                value={filterParams.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Tanggal Akhir Penerimaan"
                                type="date"
                                value={filterParams.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Jenis</InputLabel>
                                <Select
                                    value={filterParams.jenis}
                                    label="Jenis"
                                    onChange={(e) => handleFilterChange('jenis', e.target.value)}
                                >
                                    {jenisOptions.map((jenis) => (
                                        <MenuItem key={jenis} value={jenis}>
                                            {jenis}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                onClick={applyFilter}
                                sx={{ mr: 2 }}
                                fullWidth
                            >
                                Terapkan Filter
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={resetFilter}
                                sx={{ mt: 1 }}
                                fullWidth
                            >
                                Reset Filter
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {errorMsg && (
                    <Box sx={{ mb: 2 }}>
                        <Typography color="error">{errorMsg}</Typography>
                    </Box>
                )}

                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <HeaderTableCell></HeaderTableCell>
                                <HeaderTableCell>Kode Vendor</HeaderTableCell>
                                <HeaderTableCell>Nama Vendor</HeaderTableCell>
                                <HeaderTableCell>Jenis</HeaderTableCell>
                                <HeaderTableCell align="center">Saldo Akhir DPP</HeaderTableCell>
                                <HeaderTableCell align="center">Saldo Akhir PPN</HeaderTableCell>
                                <HeaderTableCell align="center">&lt;30 Hari DPP</HeaderTableCell>
                                <HeaderTableCell align="center">&lt;30 Hari PPN</HeaderTableCell>
                                <HeaderTableCell align="center">&gt;30 Hari DPP</HeaderTableCell>
                                <HeaderTableCell align="center">&gt;30 Hari PPN</HeaderTableCell>
                                <HeaderTableCell align="center">&gt;60 Hari DPP</HeaderTableCell>
                                <HeaderTableCell align="center">&gt;60 Hari PPN</HeaderTableCell>
                                <HeaderTableCell align="center">&gt;90 Hari DPP</HeaderTableCell>
                                <HeaderTableCell align="center">&gt;90 Hari PPN</HeaderTableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {groupedData.length > 0 ? (
                                groupedData.map((group, gIdx) => (
                                    <React.Fragment key={gIdx}>
                                        {group.vendorGroups.map((vendorGroup, vIdx) => (
                                            <VendorGroupRow
                                                key={vIdx}
                                                vendorGroup={vendorGroup}
                                                isExpanded={expandedRows[vendorGroup.vendorKey]}
                                                toggleExpand={toggleExpand}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={14} align="center">
                                        <Typography variant="body1" sx={{ py: 3 }}>
                                            {allData.length === 0 ?
                                                "Tidak ada data yang ditemukan" :
                                                "Tidak ada data yang sesuai dengan filter"
                                            }
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>

                        {groupedData.length > 0 && (
                            <TableFooter>
                                {/* Subtotal per group di bagian bawah */}
                                {groupedData.map((group, idx) => (
                                    <SubtotalRow key={idx}>
                                        <TableCell colSpan={4} align="left">Subtotal {group.jenis}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.dpp)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.ppn)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.lt30.dpp)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.lt30.ppn)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.gt30.dpp)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.gt30.ppn)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.gt60.dpp)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.gt60.ppn)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.gt90.dpp)}</TableCell>
                                        <TableCell align="right">{formatNumber(group.subtotal.gt90.ppn)}</TableCell>
                                    </SubtotalRow>
                                ))}

                                {/* Grand Total */}
                                <GrandTotalRow>
                                    <TableCell colSpan={4} align="left">GRAND TOTAL</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.dpp)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.ppn)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.lt30.dpp)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.lt30.ppn)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.gt30.dpp)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.gt30.ppn)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.gt60.dpp)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.gt60.ppn)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.gt90.dpp)}</TableCell>
                                    <TableCell align="right">{formatNumber(grandTotal.gt90.ppn)}</TableCell>
                                </GrandTotalRow>
                            </TableFooter>
                        )}
                    </Table>
                </TableContainer>
            </Box>
        </MainLayout>
    );
};

export default AgingHD;