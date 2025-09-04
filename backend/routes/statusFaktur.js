const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadExcel, getAllFaktur, getAgingHD } = require('../controllers/statusFakturController');

const upload = multer({ dest: 'upload/' });

router.post('/upload', upload.single('file'), uploadExcel);
router.get('/', getAllFaktur);
router.get('/aging-hd', getAgingHD);

module.exports = router;
