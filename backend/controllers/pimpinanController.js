const Pimpinan = require('../models/Pimpinan');

// GET semua pimpinan
exports.getAllPimpinan = async (req, res) => {
    try {
        const data = await Pimpinan.findAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data pimpinan' });
    }
};

// POST tambah pimpinan
exports.addPimpinan = async (req, res) => {
    try {
        const { nama } = req.body;
        const newPimpinan = await Pimpinan.create({ nama });
        res.status(201).json(newPimpinan);
    } catch (err) {
        res.status(500).json({ error: 'Gagal menambahkan pimpinan' });
    }
};

// PUT update pimpinan
exports.updatePimpinan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama } = req.body;
        const updated = await Pimpinan.update({ nama }, { where: { id } });
        res.json({ message: 'Pimpinan berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengupdate pimpinan' });
    }
};

// DELETE hapus pimpinan
exports.deletePimpinan = async (req, res) => {
    try {
        const { id } = req.params;
        await Pimpinan.destroy({ where: { id } });
        res.json({ message: 'Pimpinan berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menghapus pimpinan' });
    }
};
