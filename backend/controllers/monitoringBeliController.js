// backend/controllers/monitoringBeliController.js
const DetailBeli = require('../models/DetailBeli');

// Get semua data monitoring beli (data agregat)
const getMonitoringBeli = async (req, res) => {
    try {
        console.log('🔄 Fetching monitoring beli data...');

        // Query untuk mendapatkan data agregat
        const data = await DetailBeli.findAll({
            attributes: [
                'nomor_penerimaan',
                'kode_outlet',
                'nama_outlet',
                'nama_kreditur',
                'tanggal_penerimaan',
                [DetailBeli.sequelize.fn('SUM', DetailBeli.sequelize.col('jumlah_netto')), 'total'],
                [DetailBeli.sequelize.fn('COUNT', DetailBeli.sequelize.col('id')), 'item_count']
            ],
            group: ['nomor_penerimaan', 'kode_outlet', 'nama_outlet', 'nama_kreditur', 'tanggal_penerimaan'],
            order: [['tanggal_penerimaan', 'DESC']]
        });

        // Format data untuk frontend
        const formattedData = data.map(item => ({
            id: item.nomor_penerimaan + '-' + item.kode_outlet,
            kode_apotek: item.kode_outlet,
            nama_apotek: item.nama_outlet,
            nama_vendor: item.nama_kreditur,
            no_faktur: item.nomor_penerimaan,
            nomor_penerimaan: item.nomor_penerimaan,
            tanggal_penerimaan: item.tanggal_penerimaan,
            dpp: item.total * 0.9, // Contoh: DPP = 90% dari total
            ppn: item.total * 0.1,  // Contoh: PPN = 10% dari total
            total: item.total,
            item_count: item.dataValues.item_count,
            // Field default untuk kompatibilitas frontend
            nomor_tukar_faktur: '-',
            ap1: '-',
            ap2: '-',
            ap3: '-',
            jenis: 'REGULER'
        }));

        console.log('✅ Monitoring data found:', formattedData.length);
        res.json(formattedData);

    } catch (error) {
        console.error('❌ Error fetching monitoring beli:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data monitoring',
            error: error.message
        });
    }
};

// Get detail berdasarkan no faktur
const getDetailByFaktur = async (req, res) => {
    try {
        const { noFaktur } = req.params;
        console.log('🔄 Fetching detail for faktur:', noFaktur);

        const details = await DetailBeli.findAll({
            where: { nomor_penerimaan: noFaktur },
            attributes: [
                'kode_obat',
                'nama_obat',
                'satuan',
                'qty_beli',
                'harga_satuan',
                'jumlah_netto',
                'diskon_beli_1',
                'diskon_beli_2',
                'diskon_beli_3'
            ],
            order: [['nama_obat', 'ASC']]
        });

        // Format data untuk frontend
        const formattedData = details.map(item => ({
            kode_barang: item.kode_obat,
            nama_barang: item.nama_obat,
            satuan: item.satuan,
            qty: item.qty_beli,
            harga: item.harga_satuan,
            subtotal: item.jumlah_netto,
            diskon1: item.diskon_beli_1,
            diskon2: item.diskon_beli_2,
            diskon3: item.diskon_beli_3
        }));

        console.log('✅ Detail data found:', formattedData.length);
        res.json(formattedData);

    } catch (error) {
        console.error('❌ Error fetching detail beli:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil detail',
            error: error.message
        });
    }
};

// Get statistik monitoring
const getMonitoringStats = async (req, res) => {
    try {
        const totalRecords = await DetailBeli.count();
        const totalFaktur = await DetailBeli.count({
            distinct: true,
            col: 'nomor_penerimaan'
        });
        const totalVendor = await DetailBeli.count({
            distinct: true,
            col: 'nama_kreditur'
        });

        res.json({
            total_records: totalRecords,
            total_faktur: totalFaktur,
            total_vendor: totalVendor
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMonitoringBeli,
    getDetailByFaktur,
    getMonitoringStats
};