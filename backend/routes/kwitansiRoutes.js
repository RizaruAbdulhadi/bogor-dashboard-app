const express = require('express');
const router = express.Router();
const kwitansiController = require('../controllers/kwitansiController');

// Endpoint utama
router.post('/simpan', kwitansiController.simpanKwitansi);
router.get('/', kwitansiController.getAllKwitansi);
router.get('/:id', kwitansiController.getKwitansiById);
router.put('/:id', kwitansiController.updateKwitansi);
router.delete('/:id', kwitansiController.deleteKwitansi);

module.exports = router;
