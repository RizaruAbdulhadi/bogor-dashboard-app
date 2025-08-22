const Kreditur = require('../models/Kreditur');

// GET semua Kreditur
exports.getAllKreditur = async (req, res) => {
    try {
        const data = await Kreditur.findAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data kreditur' });
    }
};

// POST tambah kreditur
exports.addKreditur = async (req, res) => {
    try {
        const { kode_kreditur, nama_kreditur, jenis } = req.body;

        // Validasi sederhana
        if (!kode_kreditur || !nama_kreditur || !jenis) {
            return res.status(400).json({ error: 'Semua field harus diisi' });
        }

        const created = await Kreditur.create({ kode_kreditur, nama_kreditur, jenis });
        res.status(201).json({ message: 'Kreditur berhasil ditambahkan', data: created });
    } catch (err) {
        console.error('❌ Error saat tambah kreditur:', err); // Penting untuk debugging!
        res.status(500).json({ error: 'Gagal menambah kreditur' });
    }
};


// PUT update kreditur
exports.updateKreditur = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_kreditur, nama_kreditur, jenis } = req.body;

        const updated = await Kreditur.update(
            { kode_kreditur, nama_kreditur, jenis },
            { where: { id } }
        );

        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Kreditur tidak ditemukan atau tidak ada perubahan' });
        }

        res.json({ message: 'Kreditur berhasil diupdate' });
    } catch (err) {
        console.log('Error update kreditur:', err);
        res.status(500).json({ error: 'Gagal mengupdate kreditur' });
    }
};


// DELETE hapus kreditur
exports.deleteKreditur = async (req, res) => {
    try {
        const { id } = req.params;
        await Kreditur.destroy({ where: { id } });
        res.json({ message: 'Kreditur berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menghapus kreditur' });
    }
};

