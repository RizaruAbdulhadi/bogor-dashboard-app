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
    "& td": { fontSize: "1rem", fontWeight: "bold" },
}));

const GrandTotalRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: theme.palette.primary.light,
    fontWeight: "bold",
    "& td": { fontSize: "1rem", fontWeight: "bold" },
}));

const VendorGroupRow = ({ group, vendorGroup, isExpanded, toggleExpand }) => {
    return (
        <>
            <TableRow>
                <TableCell>
                    <IconButton size="small" onClick={() => toggleExpand(vendorGroup.vendorKey)}>
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{group.jenis}</TableCell>
                <TableCell>{vendorGroup.nama_vendor}</TableCell>
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
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={13}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Detail Faktur
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No. Faktur</TableCell>
                                        <TableCell>Tanggal Faktur</TableCell>
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

const AgingHD = () => {
    const [data, setData] = useState([]);
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

    const toggleExpand = (vendorKey) => {
        setExpandedRows(prev => ({
            ...prev,
            [vendorKey]: !prev[vendorKey]
        }));
    };

    // Fungsi bantu: group data per jenis & vendor, hitung subtotal + grand total
    const groupDataByJenisAndVendor = (rawData) => {
        const grouped = {};

        rawData.forEach((item) => {
            const jenis = item.jenis || "LAINNYA";
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
        Object.values(grouped).forEach((group) => {
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

        return { groupedData: Object.values(grouped), grandTotal };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/aging-hd`);
                const { groupedData, grandTotal } = groupDataByJenisAndVendor(res.data);
                setData(groupedData);
                setGrandTotal(grandTotal);
            } catch (err) {
                console.error(err);
                setErrorMsg("Gagal memuat data Aging HD. Periksa koneksi API.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Export Excel
    const exportToExcel = () => {
        const excelData = [];

        // Header
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

        data.forEach((group) => {
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

            // Subtotal per group
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
        saveAs(dataBlob, "Laporan_Aging_HD.xlsx");
    };

    if (isLoading) {
        return (
            <MainLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography>Loading data...</Typography>
                </Box>
            </MainLayout>
        );
    }

    if (errorMsg) {
        return (
            <MainLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography color="error">{errorMsg}</Typography>
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

                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <HeaderTableCell></HeaderTableCell>
                                <HeaderTableCell>Jenis</HeaderTableCell>
                                <HeaderTableCell>Vendor</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">Saldo Akhir</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&lt;30 Hari</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&gt;30 Hari</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&gt;60 Hari</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&gt;90 Hari</HeaderTableCell>
                            </TableRow>
                            <TableRow>
                                <HeaderTableCell></HeaderTableCell>
                                <HeaderTableCell></HeaderTableCell>
                                <HeaderTableCell></HeaderTableCell>
                                {["DPP","PPN","DPP","PPN","DPP","PPN","DPP","PPN","DPP","PPN"].map((label, idx)=>(
                                    <HeaderTableCell key={idx} align="center">{label}</HeaderTableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.map((group, idx) => (
                                <React.Fragment key={idx}>
                                    {group.vendorGroups.map((vendorGroup, vIdx) => (
                                        <VendorGroupRow
                                            key={vIdx}
                                            group={group}
                                            vendorGroup={vendorGroup}
                                            isExpanded={expandedRows[vendorGroup.vendorKey]}
                                            toggleExpand={toggleExpand}
                                        />
                                    ))}
                                    {/* Subtotal per group */}
                                    <SubtotalRow>
                                        <TableCell colSpan={3}>Subtotal {group.jenis}</TableCell>
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
                                </React.Fragment>
                            ))}
                        </TableBody>

                        <TableFooter>
                            <GrandTotalRow>
                                <TableCell colSpan={3}>GRAND TOTAL</TableCell>
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
                    </Table>
                </TableContainer>
            </Box>
        </MainLayout>
    );
};

export default AgingHD;