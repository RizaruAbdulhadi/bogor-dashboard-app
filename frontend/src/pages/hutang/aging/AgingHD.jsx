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
} from "@mui/material";
import { styled } from "@mui/material/styles";

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
    "& td": { fontSize: "1rem" },
    fontWeight: "700 !important",
}));

const GrandTotalRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: theme.palette.primary.light,
    fontWeight: "700 !important",
    "& td": { fontSize: "1rem" },
    fontSize: "1.1rem",
}));

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

    // Format angka
    const formatNumber = (num) =>
        Number(num || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 });

    // Fungsi bantu: group data per jenis & hitung subtotal + grand total
    const groupDataByJenis = (rawData) => {
        const grouped = {};

        rawData.forEach((item) => {
            const jenis = item.jenis || "LAINNYA";
            if (!grouped[jenis]) {
                grouped[jenis] = {
                    jenis,
                    vendors: [],
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

            if (diffDays <= 30) aging.lt30.dpp = item.dpp;
            else if (diffDays <= 60) aging.gt30.dpp = item.dpp;
            else if (diffDays <= 90) aging.gt60.dpp = item.dpp;
            else aging.gt90.dpp = item.dpp;

            if (diffDays <= 30) aging.lt30.ppn = item.ppn;
            else if (diffDays <= 60) aging.gt30.ppn = item.ppn;
            else if (diffDays <= 90) aging.gt60.ppn = item.ppn;
            else aging.gt90.ppn = item.ppn;

            grouped[jenis].vendors.push({ ...item, aging });

            // Update subtotal
            const sub = grouped[jenis].subtotal;
            sub.dpp += item.dpp;
            sub.ppn += item.ppn;
            sub.lt30.dpp += aging.lt30.dpp;
            sub.lt30.ppn += aging.lt30.ppn;
            sub.gt30.dpp += aging.gt30.dpp;
            sub.gt30.ppn += aging.gt30.ppn;
            sub.gt60.dpp += aging.gt60.dpp;
            sub.gt60.ppn += aging.gt60.ppn;
            sub.gt90.dpp += aging.gt90.dpp;
            sub.gt90.ppn += aging.gt90.ppn;
        });

        const grandTotal = {
            dpp: 0,
            ppn: 0,
            lt30: { dpp: 0, ppn: 0 },
            gt30: { dpp: 0, ppn: 0 },
            gt60: { dpp: 0, ppn: 0 },
            gt90: { dpp: 0, ppn: 0 },
        };

        Object.values(grouped).forEach((g) => {
            grandTotal.dpp += g.subtotal.dpp;
            grandTotal.ppn += g.subtotal.ppn;
            grandTotal.lt30.dpp += g.subtotal.lt30.dpp;
            grandTotal.lt30.ppn += g.subtotal.lt30.ppn;
            grandTotal.gt30.dpp += g.subtotal.gt30.dpp;
            grandTotal.gt30.ppn += g.subtotal.gt30.ppn;
            grandTotal.gt60.dpp += g.subtotal.gt60.dpp;
            grandTotal.gt60.ppn += g.subtotal.gt60.ppn;
            grandTotal.gt90.dpp += g.subtotal.gt90.dpp;
            grandTotal.gt90.ppn += g.subtotal.gt90.ppn;
        });

        return { groupedData: Object.values(grouped), grandTotal };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/aging-hd`);
                const { groupedData, grandTotal } = groupDataByJenis(res.data);
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
            "Vendor",
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
            group.vendors.forEach((vendor) => {
                const aging = vendor.aging;
                const saldoDPP =
                    aging.lt30.dpp + aging.gt30.dpp + aging.gt60.dpp + aging.gt90.dpp;
                const saldoPPN =
                    aging.lt30.ppn + aging.gt30.ppn + aging.gt60.ppn + aging.gt90.ppn;

                excelData.push([
                    group.jenis,
                    vendor.nama_vendor,
                    saldoDPP,
                    saldoPPN,
                    aging.lt30.dpp,
                    aging.lt30.ppn,
                    aging.gt30.dpp,
                    aging.gt30.ppn,
                    aging.gt60.dpp,
                    aging.gt60.ppn,
                    aging.gt90.dpp,
                    aging.gt90.ppn,
                ]);
            });

            // Subtotal per group
            excelData.push([
                `Subtotal ${group.jenis}`,
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
                                <HeaderTableCell rowSpan={2}>Jenis</HeaderTableCell>
                                <HeaderTableCell rowSpan={2}>Vendor</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">Saldo Akhir</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&lt;30 Hari</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&gt;30 Hari</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&gt;60 Hari</HeaderTableCell>
                                <HeaderTableCell colSpan={2} align="center">&gt;90 Hari</HeaderTableCell>
                            </TableRow>
                            <TableRow>
                                {["DPP","PPN","DPP","PPN","DPP","PPN","DPP","PPN","DPP","PPN"].map((label, idx)=>(
                                    <HeaderTableCell key={idx} align="center">{label}</HeaderTableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.map((group, idx) => (
                                <React.Fragment key={idx}>
                                    {group.vendors.map((vendor, vIdx) => {
                                        const a = vendor.aging;
                                        const saldoDPP = a.lt30.dpp + a.gt30.dpp + a.gt60.dpp + a.gt90.dpp;
                                        const saldoPPN = a.lt30.ppn + a.gt30.ppn + a.gt60.ppn + a.gt90.ppn;
                                        return (
                                            <StyledTableRow key={vIdx}>
                                                <TableCell>{vIdx === 0 ? group.jenis : ""}</TableCell>
                                                <TableCell>{vendor.nama_vendor}</TableCell>
                                                <TableCell align="right">{formatNumber(saldoDPP)}</TableCell>
                                                <TableCell align="right">{formatNumber(saldoPPN)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.lt30.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.lt30.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.gt30.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.gt30.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.gt60.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.gt60.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.gt90.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(a.gt90.ppn)}</TableCell>
                                            </StyledTableRow>
                                        );
                                    })}
                                    {/* Subtotal per group */}
                                    <SubtotalRow>
                                        <TableCell colSpan={2}>Subtotal {group.jenis}</TableCell>
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
                                <TableCell colSpan={2}>GRAND TOTAL</TableCell>
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

