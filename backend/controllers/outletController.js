const Outlet = require('../models/Outlet');


// Ambil semua outlet
const getAllOutlet = async (req, res) => {
    try {
        const data = await Outlet.findAll();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data outlet' });
    }
};

// Tambah outlet baru
const addOutlet = async (req, res) => {
    const { kode, nama_outlet } = req.body;
    try {
        const outletBaru = await Outlet.create({ kode, nama_outlet });
        res.json(outletBaru);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menambah outlet' });
    }
};

// Update outlet
const updateOutlet = async (req, res) => {
    const { id } = req.params;
    const { kode, nama_outlet } = req.body;
    try {
        await Outlet.update({ kode, nama_outlet }, { where: { id } });
        res.json({ message: 'Outlet berhasil diupdate' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengupdate outlet' });
    }
};

// Hapus outlet
const deleteOutlet = async (req, res) => {
    const { id } = req.params;
    try {
        await Outlet.destroy({ where: { id } });
        res.json({ message: 'Outlet berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus outlet' });
    }
};

module.exports = {
    getAllOutlet,
    addOutlet,
    updateOutlet,
    deleteOutlet,
};
