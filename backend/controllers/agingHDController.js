const { StatusFaktur, Kreditur } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

exports.getAgingData = async (req, res) => {
    try {
        const { end_date } = req.query;
        console.log('Request received with end_date:', end_date);

        if (!end_date) {
            return res.status(400).json({ error: 'Parameter end_date diperlukan' });
        }

        const endDate = moment(end_date).startOf('day');
        if (!endDate.isValid()) {
            return res.status(400).json({ error: 'Format tanggal tidak valid' });
        }

        console.log('Querying for tanggal_penerimaan <=', endDate.format('YYYY-MM-DD'));

        // OPTIMASI QUERY: Hanya ambil field yang diperlukan
        const fakturs = await StatusFaktur.findAll({
            include: [{
                model: Kreditur,
                as: 'kreditur',
                attributes: ['jenis'],
                required: false // LEFT JOIN instead of INNER JOIN
            }],
            where: {
                tanggal_penerimaan: {
                    [Op.not]: null,
                    [Op.lte]: endDate.toDate()
                }
            },
            attributes: ['id', 'nama_vendor', 'tanggal_penerimaan', 'dpp', 'ppn'], // Hanya field yang diperlukan
            // limit: 10000, // Uncomment jika perlu membatasi data untuk testing
            order: [['tanggal_penerimaan', 'DESC']] // Data terbaru pertama
        });

        console.log('Found', fakturs.length, 'records');

        // Jika tidak ada data, kembalikan response kosong
        if (fakturs.length === 0) {
            return res.json({
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

        const groupedJenis = {};
        const grandTotal = {
            dpp: 0,
            ppn: 0,
            lt30: { dpp: 0, ppn: 0 },
            gt30: { dpp: 0, ppn: 0 },
            gt60: { dpp: 0, ppn: 0 },
            gt90: { dpp: 0, ppn: 0 }
        };

        // Counter untuk progress logging
        let processedCount = 0;
        const logInterval = Math.floor(fakturs.length / 10); // Log setiap 10%

        fakturs.forEach(faktur => {
            processedCount++;

            // Log progress setiap 10%
            if (logInterval > 0 && processedCount % logInterval === 0) {
                console.log(`Processing: ${Math.round((processedCount / fakturs.length) * 100)}% complete`);
            }

            const jenis = faktur.kreditur?.jenis || 'Lainnya';
            const vendor = faktur.nama_vendor || 'Unknown';

            const penerimaan = faktur.tanggal_penerimaan;
            const tglPenerimaan = penerimaan ? moment(penerimaan).startOf('day') : null;

            let days = null;
            if (tglPenerimaan && tglPenerimaan.isValid()) {
                days = endDate.diff(tglPenerimaan, 'days');
                // Hapus console.log ini untuk performance, gunakan hanya untuk debugging
                // console.log(`Vendor: ${vendor}, Days: ${days}, Date: ${tglPenerimaan.format('YYYY-MM-DD')}`);
            }

            const dpp = Number(faktur.dpp) || 0;
            const ppn = Number(faktur.ppn) || 0;

            // Initialize jenis group jika belum ada
            if (!groupedJenis[jenis]) {
                groupedJenis[jenis] = {
                    vendors: {},
                    subtotal: {
                        dpp: 0, ppn: 0,
                        lt30: { dpp: 0, ppn: 0 },
                        gt30: { dpp: 0, ppn: 0 },
                        gt60: { dpp: 0, ppn: 0 },
                        gt90: { dpp: 0, ppn: 0 }
                    }
                };
            }

            // Initialize vendor jika belum ada
            if (!groupedJenis[jenis].vendors[vendor]) {
                groupedJenis[jenis].vendors[vendor] = {
                    nama_vendor: vendor,
                    aging: {
                        lt30: { dpp: 0, ppn: 0 },
                        gt30: { dpp: 0, ppn: 0 },
                        gt60: { dpp: 0, ppn: 0 },
                        gt90: { dpp: 0, ppn: 0 }
                    }
                };
            }

            if (days !== null) {
                let segment = null;
                if (days <= 30) segment = 'lt30';
                else if (days <= 60) segment = 'gt30';
                else if (days <= 90) segment = 'gt60';
                else segment = 'gt90';

                if (segment) {
                    // Update vendor aging
                    groupedJenis[jenis].vendors[vendor].aging[segment].dpp += dpp;
                    groupedJenis[jenis].vendors[vendor].aging[segment].ppn += ppn;

                    // Update jenis subtotal
                    groupedJenis[jenis].subtotal[segment].dpp += dpp;
                    groupedJenis[jenis].subtotal[segment].ppn += ppn;

                    // Update grand total
                    grandTotal[segment].dpp += dpp;
                    grandTotal[segment].ppn += ppn;
                }
            }

            // Update total keseluruhan (termasuk yang tidak ada days)
            groupedJenis[jenis].subtotal.dpp += dpp;
            groupedJenis[jenis].subtotal.ppn += ppn;

            grandTotal.dpp += dpp;
            grandTotal.ppn += ppn;
        });

        console.log('Grouping completed. Converting to array...');

        // Convert ke format yang diharapkan frontend
        const result = Object.entries(groupedJenis).map(([jenis, { vendors, subtotal }]) => ({
            jenis,
            vendors: Object.values(vendors),
            subtotal
        }));

        // Hitung statistik
        const totalVendors = result.reduce((acc, curr) => acc + curr.vendors.length, 0);
        const totalJenis = result.length;

        console.log('Processing completed:');
        console.log('- Jenis Kreditur:', totalJenis);
        console.log('- Total Vendors:', totalVendors);
        console.log('- Grand Total DPP:', grandTotal.dpp);
        console.log('- Grand Total PPN:', grandTotal.ppn);

        res.json({
            success: true,
            data: result,
            grandTotal,
            summary: {
                totalJenis,
                totalVendors,
                totalRecords: fakturs.length
            }
        });

    } catch (err) {
        console.error('Error in getAgingData:', err);
        res.status(500).json({
            success: false,
            error: 'Server error: ' + err.message
        });
    }
};