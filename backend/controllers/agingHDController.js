const pool = require('../config/database');
const moment = require('moment');

exports.getAgingData = async (req, res) => {
    try {
        const { end_date } = req.query;
        if (!end_date) {
            return res.status(400).json({ error: 'Parameter end_date diperlukan' });
        }

        const endDate = moment(end_date, 'YYYY-MM-DD');
        if (!endDate.isValid()) {
            return res.status(400).json({ error: 'Format end_date tidak valid' });
        }

        const query = `
      SELECT 
        k.kode_kreditur, 
        k.nama_kreditur, 
        k.jenis,
        sf.no_faktur,
        sf.tanggal_penerimaan,
        sf.dpp,
        sf.ppn,
        sf.total
      FROM kreditur k
      JOIN status_faktur sf ON k.kode_kreditur = sf.kode_vendor
      WHERE sf.tanggal_penerimaan IS NOT NULL
    `;
        const result = await pool.query(query);
        const rows = result.rows || [];

        // Format data aging
        const formatted = rows.map(r => {
            const tgl = moment(r.tanggal_penerimaan);
            const selisihHari = endDate.diff(tgl, 'days');

            let bucket = 'lt30';
            if (selisihHari > 90) bucket = 'gt90';
            else if (selisihHari > 60) bucket = 'gt60';
            else if (selisihHari > 30) bucket = 'gt30';

            return {
                jenis: r.jenis || 'Lainnya',
                vendor: r.nama_kreditur,
                aging: {
                    lt30: bucket === 'lt30' ? Number(r.total) : 0,
                    gt30: bucket === 'gt30' ? Number(r.total) : 0,
                    gt60: bucket === 'gt60' ? Number(r.total) : 0,
                    gt90: bucket === 'gt90' ? Number(r.total) : 0,
                },
                dpp: Number(r.dpp) || 0,
                ppn: Number(r.ppn) || 0,
                total: Number(r.total) || 0,
            };
        });

        // Grouping by jenis
        const grouped = {};
        const grandTotal = { lt30: 0, gt30: 0, gt60: 0, gt90: 0, dpp: 0, ppn: 0, total: 0 };

        formatted.forEach(item => {
            if (!grouped[item.jenis]) {
                grouped[item.jenis] = {
                    jenis: item.jenis,
                    vendors: [],
                    subtotal: { lt30: 0, gt30: 0, gt60: 0, gt90: 0, dpp: 0, ppn: 0, total: 0 }
                };
            }

            grouped[item.jenis].vendors.push(item);

            // Hitung subtotal
            Object.keys(item.aging).forEach(key => {
                grouped[item.jenis].subtotal[key] += item.aging[key];
                grandTotal[key] += item.aging[key];
            });
            grouped[item.jenis].subtotal.dpp += item.dpp;
            grouped[item.jenis].subtotal.ppn += item.ppn;
            grouped[item.jenis].subtotal.total += item.total;

            grandTotal.dpp += item.dpp;
            grandTotal.ppn += item.ppn;
            grandTotal.total += item.total;
        });

        res.json({ data: Object.values(grouped), grandTotal });
    } catch (error) {
        console.error('Error getAgingData:', error);
        res.status(500).json({ error: 'Gagal ambil data aging' });
    }
};
