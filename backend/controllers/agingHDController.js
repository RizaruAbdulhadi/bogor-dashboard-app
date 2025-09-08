const { StatusFaktur, Kreditur } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

exports.getAgingData = async (req, res) => {
    try {
        const { end_date } = req.query;
        console.log('Request received with end_date:', end_date); // Debug log

        if (!end_date) {
            return res.status(400).json({ error: 'Parameter end_date diperlukan' });
        }

        const endDate = moment(end_date).startOf('day');
        if (!endDate.isValid()) {
            return res.status(400).json({ error: 'Format tanggal tidak valid' });
        }

        console.log('Querying for tanggal_penerimaan <=', endDate.format('YYYY-MM-DD')); // Debug log

        const fakturs = await StatusFaktur.findAll({
            include: [{ model: Kreditur, as: 'kreditur', attributes: ['jenis'] }],
            where: {
                tanggal_penerimaan: {  // PERUBAHAN PENTING: ganti ke tanggal_penerimaan_faktur
                    [Op.not]: null,
                    [Op.lte]: endDate.toDate()
                }
            }
        });

        console.log('Found', fakturs.length, 'records'); // Debug log

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

        fakturs.forEach(faktur => {
            const jenis = faktur.kreditur?.jenis || 'Lainnya';
            const vendor = faktur.nama_vendor || 'Unknown';

            const penerimaan = faktur.tanggal_penerimaan;  // PERUBAHAN: ganti ke tanggal_penerimaan_faktur
            const tglPenerimaan = penerimaan ? moment(penerimaan).startOf('day') : null;

            let days = null;
            if (tglPenerimaan && tglPenerimaan.isValid()) {
                days = endDate.diff(tglPenerimaan, 'days');
                console.log(`Vendor: ${vendor}, Days: ${days}, Date: ${tglPenerimaan.format('YYYY-MM-DD')}`); // Debug log
            }

            const dpp = Number(faktur.dpp) || 0;
            const ppn = Number(faktur.ppn) || 0;

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
                    groupedJenis[jenis].vendors[vendor].aging[segment].dpp += dpp;
                    groupedJenis[jenis].vendors[vendor].aging[segment].ppn += ppn;

                    groupedJenis[jenis].subtotal[segment].dpp += dpp;
                    groupedJenis[jenis].subtotal[segment].ppn += ppn;

                    grandTotal[segment].dpp += dpp;
                    grandTotal[segment].ppn += ppn;
                }
            }

            // Tambah total keseluruhan
            groupedJenis[jenis].subtotal.dpp += dpp;
            groupedJenis[jenis].subtotal.ppn += ppn;

            grandTotal.dpp += dpp;
            grandTotal.ppn += ppn;
        });

        const result = Object.entries(groupedJenis).map(([jenis, { vendors, subtotal }]) => ({
            jenis,
            vendors: Object.values(vendors),
            subtotal
        }));

        console.log('Processed', result.length, 'jenis kreditur'); // Debug log
        res.json({ data: result, grandTotal });
    } catch (err) {
        console.error('Error in getAgingData:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};