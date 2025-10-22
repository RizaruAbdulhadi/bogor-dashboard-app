const Kwitansi = require('../models/Kwitansi');
const Rekening = require('../models/Rekening');
const { Op } = require('sequelize');

// ✅ POST /kwitansi/simpan
exports.simpanKwitansi = async (req, res) => {
    try {
        const payloadArray = req.body;

        if (!Array.isArray(payloadArray)) {
            return res.status(400).json({ error: 'Data harus berupa array' });
        }

        const created = await Kwitansi.bulkCreate(payloadArray);
        res.status(201).json(created);
    } catch (err) {
        console.error('❌ Gagal menyimpan kwitansi:', err);
        res.status(500).json({ error: 'Gagal menyimpan kwitansi' });
    }
};

// ✅ GET /kwitansi
// Bisa pakai query: ?penjamin=BPJS&dari=2025-10-01&sampai=2025-10-20&filterBy=pelayanan
exports.getAllKwitansi = async (req, res) => {
    try {
        const { dari, sampai, penjamin, filterBy } = req.query;
        const where = {};

        // Filter penjamin
        if (penjamin) {
            where.nama_penjamin = { [Op.iLike]: `%${penjamin}%` };
        }

        // Filter tanggal (bisa tanggal kwitansi atau tanggal pelayanan)
        if (dari && sampai) {
            if (filterBy === 'pelayanan') {
                where.tanggal_pelayanan = { [Op.between]: [dari, sampai] };
            } else {
                where.tanggal = { [Op.between]: [dari, sampai] };
            }
        }

        const kwitansi = await Kwitansi.findAll({
            where,
            include: [
                {
                    model: Rekening,
                    as: 'rekening',
                    attributes: ['id', 'bank', 'nomor']
                }
            ],
            order: [['tanggal', 'DESC']]
        });

        res.json(kwitansi);
    } catch (error) {
        console.error('❌ Gagal ambil data kwitansi:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ✅ GET /kwitansi/:id
exports.getKwitansiById = async (req, res) => {
    try {
        const id = req.params.id;
        const kwitansi = await Kwitansi.findByPk(id, {
            include: [
                {
                    model: Rekening,
                    as: 'rekening',
                    attributes: ['id', 'bank', 'nomor']
                }
            ]
        });

        if (!kwitansi) {
            return res.status(404).json({ error: 'Kwitansi tidak ditemukan' });
        }

        res.json(kwitansi);
    } catch (err) {
        console.error('❌ Gagal mengambil detail kwitansi:', err);
        res.status(500).json({ error: 'Gagal mengambil detail kwitansi' });
    }
};

// ✅ PUT /kwitansi/:id
exports.updateKwitansi = async (req, res) => {
    try {
        const id = req.params.id;
        const kwitansi = await Kwitansi.findByPk(id);

        if (!kwitansi) {
            return res.status(404).json({ error: 'Kwitansi tidak ditemukan' });
        }

        await kwitansi.update(req.body);
        res.json(kwitansi);
    } catch (err) {
        console.error('❌ Gagal update kwitansi:', err);
        res.status(500).json({ error: 'Gagal mengupdate kwitansi' });
    }
};

// ✅ DELETE /kwitansi/:id
exports.deleteKwitansi = async (req, res) => {
    try {
        const id = req.params.id;
        const kwitansi = await Kwitansi.findByPk(id);

        if (!kwitansi) {
            return res.status(404).json({ error: 'Kwitansi tidak ditemukan' });
        }

        await kwitansi.destroy();
        res.json({ message: 'Kwitansi berhasil dihapus' });
    } catch (err) {
        console.error('❌ Gagal menghapus kwitansi:', err);
        res.status(500).json({ error: 'Gagal menghapus kwitansi' });
    }
};
