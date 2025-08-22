const express = require('express');
const router = express.Router();
const pool = require('../db');

const formatDate = (excelDate) => {
    if (!excelDate) return null;
    try {
        const date = new Date(excelDate);
        date.setHours(date.getHours() + 7); // Adjust for timezone
        return date.toISOString().split('T')[0];
    } catch (err) {
        console.error('Error formatting date:', err);
        return null;
    }
};

const getRomanMonth = (monthNumber) => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return monthNumber >= 0 && monthNumber < 12 ? roman[monthNumber] : '';
};

const handleDbError = (err, res, customMessage = 'Database error') => {
    console.error('❌ DB Error:', err);
    return res.status(500).json({
        success: false,
        message: customMessage,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// Simpan data ke database
router.post('/simpan', async (req, res) => {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak valid atau kosong'
        });
    }

    try {
        const { rows } = await pool.query('SELECT MAX(no) AS max_no FROM kwitansi');
        let nextNo = (rows[0].max_no || 0) + 1;

        const now = new Date();
        const bulanRomawi = getRomanMonth(now.getMonth());
        const tahun = now.getFullYear();

        const insertPromises = data.map(async (row) => {
            const isExcel = row.hasOwnProperty("No") || row.hasOwnProperty("Nama Debitur");

            const nomorKwitansiFormatted = isExcel
                ? `BGR/${row["Nomor Kwitansi"]}/${bulanRomawi}/${tahun}`
                : `BGR/${row.nomor_kwitansi}/${bulanRomawi}/${tahun}`;

            const insertData = {
                no: nextNo++,
                nomor_kwitansi: nomorKwitansiFormatted,
                nama_penjamin: isExcel ? row["Nama Debitur"] : row.nama_penjamin,
                tanggal: isExcel ? formatDate(row["Tanggal"]) : row.tanggal,
                keterangan: isExcel ? row["Keterangan"] : row.keterangan,
                nominal: isExcel ? parseFloat(row["Nominal"]) || 0 : parseFloat(row.nominal) || 0,
                nomor_rekening: isExcel ? null : row.nomor_rekening,
                pimpinan: isExcel ? null : row.pimpinan,
                outlet: isExcel ? null : row.outlet,
                terbilang: isExcel ? null : row.terbilang
            };

            if (!insertData.nama_penjamin || !insertData.tanggal || !insertData.nomor_kwitansi) {
                throw new Error('Data yang diperlukan tidak lengkap');
            }

            return pool.query(
                `INSERT INTO kwitansi (
                    no, nomor_kwitansi, nama_penjamin, tanggal, keterangan, nominal, 
                    nomor_rekening, pimpinan, outlet, terbilang
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING no`,
                Object.values(insertData)
            );
        });

        const results = await Promise.all(insertPromises);
        return res.json({
            success: true,
            message: `✅ ${results.length} data berhasil disimpan`,
            insertedCount: results.length
        });

    } catch (err) {
        return handleDbError(err, res, 'Gagal menyimpan data');
    }
});

// Ambil daftar rekening
router.get('/rekening', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nomor AS nomor_rekening, bank FROM rekening ORDER BY bank');
        return res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        return handleDbError(err, res, 'Gagal mengambil data rekening');
    }
});

// Ambil daftar pimpinan
router.get('/pimpinan', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nama AS pimpinan FROM pimpinan ORDER BY nama');
        return res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        return handleDbError(err, res, 'Gagal mengambil data pimpinan');
    }
});

// Ambil detail kwitansi by ID (menggabungkan kedua endpoint sebelumnya)
router.get('/detail/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                k.*,
                r.bank AS nama_bank,
                p.nama AS pimpinan
            FROM kwitansi k
            LEFT JOIN rekening r ON k.nomor_rekening = r.nomor
            LEFT JOIN pimpinan p ON k.pimpinan = p.nama
            WHERE k.no = $1 LIMIT 1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kwitansi tidak ditemukan'
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Detail kwitansi error:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail kwitansi',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get list of kwitansi with pagination
router.get('/list', async (req, res) => {
    const { dari, sampai, penjamin, page = 1, limit = 10 } = req.query;

    try {
        let baseQuery = 'FROM kwitansi';
        const conditions = [];
        const params = [];

        if (dari) {
            conditions.push(`tanggal >= $${params.length + 1}`);
            params.push(dari);
        }

        if (sampai) {
            conditions.push(`tanggal <= $${params.length + 1}`);
            params.push(sampai);
        }

        if (penjamin) {
            conditions.push(`nama_penjamin ILIKE $${params.length + 1}`);
            params.push(`%${penjamin}%`);
        }

        if (conditions.length > 0) {
            baseQuery += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Get paginated data
        const offset = (page - 1) * limit;
        const dataQuery = `SELECT * ${baseQuery} ORDER BY tanggal DESC, no DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await pool.query(dataQuery, [...params, limit, offset]);

        // Get total count
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const countResult = await pool.query(countQuery, params);

        return res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total)
            }
        });

    } catch (err) {
        return handleDbError(err, res, 'Gagal mengambil daftar kwitansi');
    }
});

module.exports = router;