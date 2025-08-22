const express = require('express');
const router = express.Router();
const OutletController = require('../controllers/outletController');

router.get('/', OutletController.getAllOutlet);
router.post('/', OutletController.addOutlet);
router.put('/:id', OutletController.updateOutlet);
router.delete('/:id', OutletController.deleteOutlet);

module.exports = router;
