const express = require('express');
const router = express.Router();
const rekeningController = require('../controllers/rekeningController');

router.get('/', rekeningController.getAllRekening);
router.post('/', rekeningController.addRekening);
router.delete('/:id', rekeningController.deleteRekening);

module.exports = router;
