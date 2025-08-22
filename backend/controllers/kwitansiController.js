const Kwitansi = require('../models/Kwitansi');
const Rekening = require('../models/Rekening');
const { Op } = require('sequelize');

// ✅ POST /kwitansi (simpan banyak kwitansi sekaligus)
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

// ✅ GET /kwitansi (semua data kwitansi)
exports.getAllKwitansi = async (req, res) => {
    try {
        const { dari, sampai, penjamin } = req.query;
        const where = {};

        if (penjamin) {
            where.nama_penjamin = { [Op.iLike]: `%${penjamin}%` };
        }
        if (dari && sampai) {
            where.tanggal = { [Op.between]: [dari, sampai] };
        }

        const kwitansi = await Kwitansi.findAll({
            where,
            include: [{
                model: Rekening,
                as: 'rekening',
                attributes: ['id', 'bank', 'nomor']
            }]
        });

        res.json(kwitansi);
    } catch (error) {
        console.error('Gagal ambil data kwitansi:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// ✅ GET /kwitansi/:id (detail satu kwitansi)
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


// ✅ PUT /kwitansi/:id (edit/update kwitansi)
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

// ✅ DELETE /kwitansi/:id (hapus kwitansi)
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
