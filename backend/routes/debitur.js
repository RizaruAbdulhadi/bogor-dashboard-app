const express = require('express');
const router = express.Router();
const debiturController = require('../controllers/debiturController');

router.get('/', debiturController.getAllDebitur);
router.post('/', debiturController.addDebitur);
router.put('/:id', debiturController.updateDebitur);
router.delete('/:id', debiturController.deleteDebitur);


module.exports = router;
