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
        sf.jenis,
        sf.no_faktur,
        sf.tanggal_penerimaan,
        sf.dpp,
        sf.ppn,
        sf.total
      FROM status_faktur sf
      WHERE sf.tanggal_penerimaan IS NOT NULL
    `;
        const result = await pool.query(query);
        const rows = result.rows || [];

        const grouped = {};
        const grandTotal = { lt30: 0, gt30: 0, gt60: 0, gt90: 0, dpp: 0, ppn: 0, total: 0 };

        rows.forEach(r => {
            const tgl = moment(r.tanggal_penerimaan);
            const selisihHari = endDate.diff(tgl, 'days');

            let bucket = 'lt30';
            if (selisihHari > 90) bucket = 'gt90';
            else if (selisihHari > 60) bucket = 'gt60';
            else if (selisihHari > 30) bucket = 'gt30';

            const jenis = r.jenis || 'Lainnya';

            if (!grouped[jenis]) {
                grouped[jenis] = {
                    jenis,
                    vendors: [],
                    subtotal: { lt30: 0, gt30: 0, gt60: 0, gt90: 0, dpp: 0, ppn: 0, total: 0 }
                };
            }

            const vendorData = {
                no_faktur: r.no_faktur,
                aging: {
                    lt30: bucket === 'lt30' ? Number(r.total) : 0,
                    gt30: bucket === 'gt30' ? Number(r.total) : 0,
                    gt60: bucket === 'gt60' ? Number(r.total) : 0,
                    gt90: bucket === 'gt90' ? Number(r.total) : 0,
                },
                dpp: Number(r.dpp) || 0,
                ppn: Number(r.ppn) || 0,
                total: Number(r.total) || 0
            };

            grouped[jenis].vendors.push(vendorData);

            // subtotal per jenis
            Object.keys(vendorData.aging).forEach(key => {
                grouped[jenis].subtotal[key] += vendorData.aging[key];
                grandTotal[key] += vendorData.aging[key];
            });
            grouped[jenis].subtotal.dpp += vendorData.dpp;
            grouped[jenis].subtotal.ppn += vendorData.ppn;
            grouped[jenis].subtotal.total += vendorData.total;

            grandTotal.dpp += vendorData.dpp;
            grandTotal.ppn += vendorData.ppn;
            grandTotal.total += vendorData.total;
        });

        res.json({ data: Object.values(grouped), grandTotal });
    } catch (error) {
        console.error('Error getAgingData:', error);
        res.status(500).json({ error: 'Gagal ambil data aging' });
    }
};
