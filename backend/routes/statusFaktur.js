const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadExcel, getAllFaktur, getAgingHD } = require('../controllers/statusFakturController');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Pastikan folder uploads ada
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ✅ POST untuk upload file
router.post('/uploads', upload.single('file'), uploadExcel);

// ✅ GET untuk mendapatkan list files
router.get('/uploads', (req, res) => {
    const uploadDir = 'uploads/';

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: 'Cannot read uploads directory' });
        }

        // Filter hanya file (bukan folder) dan map informasi file
        const fileList = files
            .filter(file => fs.statSync(path.join(uploadDir, file)).isFile())
            .map(file => {
                const filePath = path.join(uploadDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    uploadDate: stats.mtime,
                    size: stats.size,
                    url: `/api/faktur/uploads/${file}`
                };
            });

        res.json(fileList);
    });
});

// ✅ GET untuk download file tertentu
router.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Routes lainnya
router.get('/', getAllFaktur);
router.get('/aging-hd', getAgingHD);

module.exports = router;