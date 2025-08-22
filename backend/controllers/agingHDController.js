const { StatusFaktur, Kreditur } = require('../models');
const moment = require('moment');

exports.getAgingData = async (req, res) => {
    try {
        const fakturs = await StatusFaktur.findAll({
            include: [{ model: Kreditur, as: 'kreditur', attributes: ['jenis'] }]
        });

        const today = moment().startOf('day');
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

            const penerimaan = faktur.tanggal_penerimaan;
            const tglPenerimaan = penerimaan ? moment(penerimaan).startOf('day') : null;
            const days = tglPenerimaan && tglPenerimaan.isValid()
                ? today.diff(tglPenerimaan, 'days')
                : null;

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
                if (days < 30) segment = 'lt30';
                else if (days < 60) segment = 'gt30';
                else if (days < 90) segment = 'gt60';
                else segment = 'gt90';

                groupedJenis[jenis].vendors[vendor].aging[segment].dpp += dpp;
                groupedJenis[jenis].vendors[vendor].aging[segment].ppn += ppn;

                groupedJenis[jenis].subtotal[segment].dpp += dpp;
                groupedJenis[jenis].subtotal[segment].ppn += ppn;

                grandTotal[segment].dpp += dpp;
                grandTotal[segment].ppn += ppn;
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

        res.json({ data: result, grandTotal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
