const express = require('express');
const router = express.Router();
const { getAgingData } = require('../controllers/agingHDController');

router.get('/aging-hd', getAgingData);

module.exports = router;
