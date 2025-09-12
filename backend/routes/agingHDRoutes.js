const express = require('express');
const router = express.Router();
const agingHDController = require('../controllers/agingHDController');

router.get('/', agingHDController.getAgingData);

module.exports = router;
