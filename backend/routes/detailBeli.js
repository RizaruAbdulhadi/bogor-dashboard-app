const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    uploadFile,
    getUploadedFiles,
    downloadFile,
    deleteFile,
    getFileStatus
} = require('../controllers/detailBeliController');

const router = express.Router();

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        // Buat folder uploads jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pembelian-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || ['.xlsx', '.xls'].includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file Excel yang diizinkan'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB
    }
});

// Routes
router.post('/upload', upload.single('file'), uploadFile);
router.get('/uploads', getUploadedFiles);
router.get('/uploads/:id/download', downloadFile);
router.delete('/uploads/:id', deleteFile);
router.get('/uploads/:id/status', getFileStatus);

module.exports = router;