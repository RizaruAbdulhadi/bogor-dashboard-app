const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const StatusFaktur = require('../models/StatusFaktur');

exports.uploadExcel = async (req, res) => {
    try {
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Ambil isi sheet sebagai array of objects, isi kosong jadi ''
        const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        // Bersihkan nama kolom (hapus spasi depan/belakang)
        const cleanedData = rawRows.map(row => {
            const cleanedRow = {};
            for (let key in row) {
                cleanedRow[key.trim()] = row[key];
            }
            return cleanedRow;
        });

        // Debug contoh kolom
        console.log('Contoh row:', cleanedData[0]);

        const fakturData = cleanedData.map(row => ({
            kode_bm: row['KODE BM'] || null,
            nama_bm: row['NAMA BM'] || null,
            kode_apotek: row['KODE APOTEK'] || null,
            nama_apotek: row['NAMA APOTEK'] || null,
            kode_vendor: row['KODE VENDOR'] || null,
            nama_vendor: row['NAMA VENDOR'] || null,
            no_faktur: row['NO FAKTUR'] || null,
            tanggal_faktur: parseExcelDate(row['TANGGAL FAKTUR']),
            nomor_penerimaan: row['NOMOR PENERIMAAN FAKTUR'] || null,
            tanggal_penerimaan: parseExcelDate(row['TANGGAL PENERIMAAN FAKTUR']),
            tanggal_terimafisik_faktur: parseExcelDate(row['TANGGAL TERIMA FISIK FAKTUR']),
            nomor_tukar_faktur: row['NOMOR TUKAR FAKTUR'] || null,
            tanggal_tukarfaktur: parseExcelDate(row['TANGGAL TUKAR FAKTUR']),
            dpp: parseFloat(row['DPP']) || 0,
            ppn: parseFloat(row['PPN']) || 0,
            total: parseFloat(row['TOTAL NILAI FAKTUR']) || 0,
            ap1: row['NOMOR AP1'] || null,
            tanggal_ap1: parseExcelDate(row['TANGGAL AP1']),
            ap2: row['NO DAFTAR BAYAR (AP2)'] || null,
            tanggal_ap2: parseExcelDate(row['TANGGAL DAFTAR BAYAR (AP2)']),
            ap3: row['NO DAFTAR TERBAYAR (AP3)'] || null,
            tanggal_ap3: parseExcelDate(row['TANGGAL DAFTAR TERBAYAR (AP3)']),
            top: row['TOP VENDOR'] || null,
            seri_pajak: row['NO SERI PAJAK'] || null,
            tanggal_fakturpajak: parseExcelDate(row['TANGGAL FAKTUR PAJAK']),
            tanggal_laporpajak: parseExcelDate(row['TANGGAL LAPOR PAJAK']),
            jenis: row['JENIS'] || null
        }));

        await StatusFaktur.bulkCreate(fakturData, { validate: true });
        fs.unlinkSync(filePath);

        res.json({ success: true, message: 'Upload sukses dan data disimpan' });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ success: false, message: 'Gagal upload', error: err.message });
    }
};

// Fungsi bantu: parsing tanggal dari Excel
function parseExcelDate(value) {
    if (!value) return null;

    if (typeof value === 'number') {
        // Format serial Excel number
        return new Date((value - 25567 - 2) * 86400 * 1000);
    }

    // Format string (misal: "16-12-2024" → jadi "2024-12-16")
    const parts = value.split(/[-/]/);
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}`);
    }

    const date = new Date(value);
    return isNaN(date) ? null : date;
}

exports.getAllFaktur = async (req, res) => {
    try {
        const faktur = await StatusFaktur.findAll();
        res.json(faktur);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAgingHD = async (req, res) => {
    try {
        const faktur = await StatusFaktur.findAll();
        const today = new Date();

        // Hitung aging
        const fakturWithAging = faktur.map(f => {
            const tanggalFaktur = f.tanggal_faktur || f.tanggal_penerimaan || today;
            const diffDays = Math.floor((today - new Date(tanggalFaktur)) / (1000 * 60 * 60 * 24));

            let aging = {
                lt30: { dpp: 0, ppn: 0 },
                gt30: { dpp: 0, ppn: 0 },
                gt60: { dpp: 0, ppn: 0 },
                gt90: { dpp: 0, ppn: 0 },
            };

            if (diffDays <= 30) aging.lt30 = { dpp: f.dpp, ppn: f.ppn };
            else if (diffDays <= 60) aging.gt30 = { dpp: f.dpp, ppn: f.ppn };
            else if (diffDays <= 90) aging.gt60 = { dpp: f.dpp, ppn: f.ppn };
            else aging.gt90 = { dpp: f.dpp, ppn: f.ppn };

            return {
                ...f.dataValues,
                aging
            };
        });

        // Kelompokkan per jenis
        const grouped = {};
        fakturWithAging.forEach(f => {
            if (!grouped[f.jenis]) grouped[f.jenis] = [];
            grouped[f.jenis].push(f);
        });

        // Buat struktur data untuk frontend
        const data = [];
        const grandTotal = {
            dpp: 0, ppn: 0,
            lt30: { dpp: 0, ppn: 0 },
            gt30: { dpp: 0, ppn: 0 },
            gt60: { dpp: 0, ppn: 0 },
            gt90: { dpp: 0, ppn: 0 },
        };

        for (let jenis in grouped) {
            const vendors = grouped[jenis];
            const subtotal = {
                dpp: 0, ppn: 0,
                lt30: { dpp: 0, ppn: 0 },
                gt30: { dpp: 0, ppn: 0 },
                gt60: { dpp: 0, ppn: 0 },
                gt90: { dpp: 0, ppn: 0 },
            };

            vendors.forEach(v => {
                subtotal.dpp += v.dpp;
                subtotal.ppn += v.ppn;
                subtotal.lt30.dpp += v.aging.lt30.dpp;
                subtotal.lt30.ppn += v.aging.lt30.ppn;
                subtotal.gt30.dpp += v.aging.gt30.dpp;
                subtotal.gt30.ppn += v.aging.gt30.ppn;
                subtotal.gt60.dpp += v.aging.gt60.dpp;
                subtotal.gt60.ppn += v.aging.gt60.ppn;
                subtotal.gt90.dpp += v.aging.gt90.dpp;
                subtotal.gt90.ppn += v.aging.gt90.ppn;

                // Update grand total
                grandTotal.dpp += v.dpp;
                grandTotal.ppn += v.ppn;
                grandTotal.lt30.dpp += v.aging.lt30.dpp;
                grandTotal.lt30.ppn += v.aging.lt30.ppn;
                grandTotal.gt30.dpp += v.aging.gt30.dpp;
                grandTotal.gt30.ppn += v.aging.gt30.ppn;
                grandTotal.gt60.dpp += v.aging.gt60.dpp;
                grandTotal.gt60.ppn += v.aging.gt60.ppn;
                grandTotal.gt90.dpp += v.aging.gt90.dpp;
                grandTotal.gt90.ppn += v.aging.gt90.ppn;
            });

            data.push({
                jenis,
                vendors: vendors.map(v => ({
                    nama_vendor: v.nama_vendor,
                    aging: v.aging
                })),
                subtotal
            });
        }

        res.json({ data, grandTotal });
    } catch (err) {
        console.error("❌ Gagal getAgingHD:", err);
        res.status(500).json({ message: err.message });
    }
};

