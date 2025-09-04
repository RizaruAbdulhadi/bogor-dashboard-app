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
    Paper,
    Typography,
    Button,
    Box,
    TableFooter,
    TableContainer,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
    "&:last-child td, &:last-child th": {
        border: 0,
    },
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/aging-hd`);
                setData(res.data.data);
                setGrandTotal(res.data.grandTotal);
            } catch (err) {
                console.error("❌ Gagal fetch data Aging HD:", err);
                setErrorMsg("Gagal memuat data Aging HD. Periksa koneksi API.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatNumber = (num) =>
        Number(num || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 });

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

        // Isi data
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

        // Grand total
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

        // Auto width
        const colWidths = excelData[0].map((_, i) => ({
            wch: Math.max(
                ...excelData.map((row) => String(row[i] || "").length + 2)
            ),
        }));
        ws["!cols"] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AgingHD");

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
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
                    <Typography variant="h4" component="h2" gutterBottom>
                        Laporan Aging Hutang Dagang
                    </Typography>
                    <Button variant="contained" color="primary" onClick={exportToExcel} sx={{ ml: 2 }}>
                        Export to Excel
                    </Button>
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
                                <HeaderTableCell align="center">DPP</HeaderTableCell>
                                <HeaderTableCell align="center">PPN</HeaderTableCell>
                                <HeaderTableCell align="center">DPP</HeaderTableCell>
                                <HeaderTableCell align="center">PPN</HeaderTableCell>
                                <HeaderTableCell align="center">DPP</HeaderTableCell>
                                <HeaderTableCell align="center">PPN</HeaderTableCell>
                                <HeaderTableCell align="center">DPP</HeaderTableCell>
                                <HeaderTableCell align="center">PPN</HeaderTableCell>
                                <HeaderTableCell align="center">DPP</HeaderTableCell>
                                <HeaderTableCell align="center">PPN</HeaderTableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.map((group, idx) => (
                                <React.Fragment key={idx}>
                                    {group.vendors.map((vendor, vIdx) => {
                                        const aging = vendor.aging;
                                        const saldoDPP =
                                            aging.lt30.dpp + aging.gt30.dpp + aging.gt60.dpp + aging.gt90.dpp;
                                        const saldoPPN =
                                            aging.lt30.ppn + aging.gt30.ppn + aging.gt60.ppn + aging.gt90.ppn;

                                        return (
                                            <StyledTableRow key={vIdx}>
                                                <TableCell>{vIdx === 0 ? group.jenis : ""}</TableCell>
                                                <TableCell>{vendor.nama_vendor}</TableCell>
                                                <TableCell align="right">{formatNumber(saldoDPP)}</TableCell>
                                                <TableCell align="right">{formatNumber(saldoPPN)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.lt30.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.lt30.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.gt30.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.gt30.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.gt60.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.gt60.ppn)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.gt90.dpp)}</TableCell>
                                                <TableCell align="right">{formatNumber(aging.gt90.ppn)}</TableCell>
                                            </StyledTableRow>
                                        );
                                    })}

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
