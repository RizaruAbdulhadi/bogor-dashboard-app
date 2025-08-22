const express = require('express');
const router = express.Router();
const krediturController = require('../controllers/krediturController');

router.get('/', krediturController.getAllKreditur);
router.post('/', krediturController.addKreditur);
router.put('/:id', krediturController.updateKreditur);
router.delete('/:id', krediturController.deleteKreditur);


module.exports = router;
