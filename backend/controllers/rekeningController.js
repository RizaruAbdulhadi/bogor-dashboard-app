const Rekening = require('../models/Rekening');

// GET all rekening
exports.getAllRekening = async (req, res) => {
    try {
        const data = await Rekening.findAll();
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching rekening:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST add rekening
exports.addRekening = async (req, res) => {
    const { bank, nomor } = req.body;
    try {
        const newRek = await Rekening.create({ bank, nomor });
        res.status(201).json(newRek);
    } catch (err) {
        console.error('Error adding rekening:', err);
        res.status(500).json({ error: 'Failed to add rekening' });
    }
};

// DELETE rekening by ID
exports.deleteRekening = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Rekening.destroy({ where: { id } });
        if (deleted) {
            res.status(200).json({ message: 'Rekening deleted' });
        } else {
            res.status(404).json({ error: 'Rekening not found' });
        }
    } catch (err) {
        console.error('Error deleting rekening:', err);
        res.status(500).json({ error: 'Failed to delete rekening' });
    }
};
