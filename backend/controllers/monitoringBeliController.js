const DetailBeli = require('../models/DetailBeli');

// Get semua data monitoring beli
const getMonitoringBeli = async (req, res) => {
    try {
        console.log('🔄 Fetching monitoring beli data...');

        // Query untuk mendapatkan data monitoring beli
        const data = await DetailBeli.findAll({
            attributes: [
                'id',
                'kode_outlet',
                'nama_outlet',
                'nama_kreditur',
                'nomor_penerimaan',
                'tanggal_penerimaan',
                'tanggal_terima_fisik_faktur',
                'kode_obat',
                'nama_obat',
                'jumlah_netto',
                'satuan',
                'qty_beli',
                'harga_satuan'
            ],
            order: [['tanggal_penerimaan', 'DESC']]
        });

        console.log('📊 Raw data from database:', JSON.stringify(data, null, 2));

        // Format data untuk frontend
        const formattedData = data.map(item => ({
            id: item.id,
            kode_outlet: item.kode_outlet || '-',
            nama_apotek: item.nama_outlet || '-',
            nama_vendor: item.nama_kreditur || '-',
            no_faktur: item.nomor_penerimaan || '-',
            nomor_penerimaan: item.nomor_penerimaan || '-',
            tanggal_penerimaan: item.tanggal_penerimaan,
            tanggal_terima_fisik_faktur: item.tanggal_terima_fisik_faktur || '-',
            kode_obat: item.kode_obat || '-',
            nama_obat: item.nama_obat || '-',
            jumlah_netto: item.jumlah_netto || 0,
            satuan: item.satuan || '-',
            qty_beli: item.qty_beli || 0,
            harga_satuan: item.harga_satuan || 0
        }));

        console.log('✅ Monitoring data found:', formattedData.length);
        console.log('📋 Sample data:', formattedData[0]); // Log sample data pertama

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
            where: {
                nomor_penerimaan: noFaktur
            },
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

        // Debug: lihat data mentah dari database
        console.log('📦 Raw detail data:', JSON.stringify(details, null, 2));

        // Format data untuk frontend
        const formattedData = details.map(item => ({
            kode_barang: item.kode_obat || '-',
            nama_barang: item.nama_obat || '-',
            satuan: item.satuan || '-',
            qty: item.qty_beli || 0,
            harga: item.harga_satuan || 0,
            subtotal: item.jumlah_netto || 0,
            diskon1: item.diskon_beli_1 || 0,
            diskon2: item.diskon_beli_2 || 0,
            diskon3: item.diskon_beli_3 || 0
        }));

        console.log('✅ Detail data found:', formattedData.length);

        if (formattedData.length === 0) {
            console.log('⚠️  No details found for faktur:', noFaktur);
        }

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