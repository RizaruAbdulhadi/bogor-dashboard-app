const Kwitansi = require('../models/Kwitansi');
const Rekening = require('../models/Rekening');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ✅ POST /api/kwitansi/simpan
exports.simpanKwitansi = async (req, res) => {
    try {
        let data = req.body;

        // Jika bukan array, jadikan array
        if (!Array.isArray(data)) {
            data = [data];
        }

        // Validasi dan format data
        const validData = data.map((item, index) => {
            const required = [
                'nama_penjamin',
                'tanggal',
                'tanggal_pelayanan',
                'nomor_kwitansi',
                'nominal',
                'terbilang',
                'nomor_rekening',
                'pimpinan',
                'outlet',
                'keterangan'
            ];

            // Cek field wajib
            const missing = required.filter(f => !item[f]);
            if (missing.length > 0) {
                throw new Error(`Baris ${index + 1}: Field wajib kosong → ${missing.join(', ')}`);
            }

            // Pastikan tanggal valid
            const tanggal = dayjs(item.tanggal).isValid()
                ? dayjs(item.tanggal).format('YYYY-MM-DD')
                : null;
            const tanggal_pelayanan = dayjs(item.tanggal_pelayanan).isValid()
                ? dayjs(item.tanggal_pelayanan).format('YYYY-MM-DD')
                : null;

            return { ...item, tanggal, tanggal_pelayanan };
        });

        const created = await Kwitansi.bulkCreate(validData, { validate: true });
        res.status(201).json({
            message: '✅ Kwitansi berhasil disimpan',
            data: created
        });
    } catch (err) {
        console.error('❌ Gagal menyimpan kwitansi:', err.message);
        res.status(400).json({
            error: 'Gagal menyimpan kwitansi',
            detail: err.message
        });
    }
};

// ✅ GET /api/kwitansi
// Bisa pakai query: ?penjamin=BPJS&dari=2025-10-01&sampai=2025-10-20&filterBy=pelayanan
exports.getAllKwitansi = async (req, res) => {
    try {
        const { dari, sampai, penjamin, filterBy } = req.query;
        const where = {};

        // Filter penjamin
        if (penjamin) {
            where.nama_penjamin = { [Op.iLike]: `%${penjamin}%` };
        }

        // Filter tanggal (kwitansi / pelayanan)
        if (dari && sampai) {
            const field = filterBy === 'pelayanan' ? 'tanggal_pelayanan' : 'tanggal';
            where[field] = { [Op.between]: [dari, sampai] };
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

// ✅ GET /api/kwitansi/:id
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

// ✅ PUT /api/kwitansi/:id
exports.updateKwitansi = async (req, res) => {
    try {
        const id = req.params.id;
        const kwitansi = await Kwitansi.findByPk(id);

        if (!kwitansi) {
            return res.status(404).json({ error: 'Kwitansi tidak ditemukan' });
        }

        await kwitansi.update(req.body);
        res.json({ message: '✅ Kwitansi berhasil diperbarui', data: kwitansi });
    } catch (err) {
        console.error('❌ Gagal update kwitansi:', err);
        res.status(500).json({ error: 'Gagal mengupdate kwitansi' });
    }
};

// ✅ DELETE /api/kwitansi/:id
exports.deleteKwitansi = async (req, res) => {
    try {
        const id = req.params.id;
        const kwitansi = await Kwitansi.findByPk(id);

        if (!kwitansi) {
            return res.status(404).json({ error: 'Kwitansi tidak ditemukan' });
        }

        await kwitansi.destroy();
        res.json({ message: '🗑️ Kwitansi berhasil dihapus' });
    } catch (err) {
        console.error('❌ Gagal menghapus kwitansi:', err);
        res.status(500).json({ error: 'Gagal menghapus kwitansi' });
    }
};
