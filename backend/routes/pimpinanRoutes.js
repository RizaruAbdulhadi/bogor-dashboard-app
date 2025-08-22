const express = require('express');
const router = express.Router();
const pimpinanController = require('../controllers/pimpinanController');

router.get('/', pimpinanController.getAllPimpinan);
router.post('/', pimpinanController.addPimpinan);
router.put('/:id', pimpinanController.updatePimpinan);
router.delete('/:id', pimpinanController.deletePimpinan);

module.exports = router;
