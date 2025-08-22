const Debitur = require('../models/Debitur');

// GET semua debitur
exports.getAllDebitur = async (req, res) => {
    try {
        const data = await Debitur.findAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data debitur' });
    }
};

// POST tambah debitur
exports.addDebitur = async (req, res) => {
    try {
        const { nama_debitur } = req.body;
        const newDebitur = await Debitur.create({ nama_debitur });
        res.status(201).json(newDebitur);
    } catch (err) {
        res.status(500).json({ error: 'Gagal menambahkan debitur' });
    }
};

// PUT update debitur
exports.updateDebitur = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_debitur } = req.body;
        const updated = await Debitur.update({ nama_debitur }, { where: { id } });
        res.json({ message: 'Debitur berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengupdate debitur' });
    }
};

// DELETE hapus debitur
exports.deleteDebitur = async (req, res) => {
    try {
        const { id } = req.params;
        await Debitur.destroy({ where: { id } });
        res.json({ message: 'Debitur berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menghapus debitur' });
    }
};

