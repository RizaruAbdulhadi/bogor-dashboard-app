const express = require('express');
const {
    getMonitoringBeli,
    getDetailByFaktur,
    getMonitoringStats
} = require('../controllers/monitoringBeliController');

const router = express.Router();

router.get('/', getMonitoringBeli);
router.get('/stats', getMonitoringStats);
router.get('/:noFaktur', getDetailByFaktur);

module.exports = router;