const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadExcel, getAllFaktur, getAgingHD } = require('../controllers/statusFakturController');

// Konfigurasi multer yang lebih baik
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Buat nama file unik dengan timestamp
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit 10MB
    }
});

// Routes
router.post('/uploads', upload.single('file'), uploadExcel);
router.get('/', getAllFaktur);
router.get('/aging-hd', getAgingHD);

// Tambahkan route untuk mendapatkan file yang diupload
router.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    res.sendFile(filename, { root: 'uploads' }, (err) => {
        if (err) {
            res.status(404).json({ error: 'File not found' });
        }
    });
});

module.exports = router;