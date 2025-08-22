const pool = require('../config/database');

const getAgingHD = async () => {
    try {
        const query = `
      SELECT 
        k.kode_kreditur, 
        k.nama_kreditur, 
        k.jenis,
        sf.no_faktur,
        sf.tanggal_penerimaan,
        CURRENT_DATE - sf.tanggal_penerimaan AS selisih_hari,
        sf.total
      FROM 
        kreditur k
      JOIN 
        status_faktur sf ON k.kode_kreditur = sf.kode_vendor
      WHERE 
        sf.tanggal_penerimaan IS NOT NULL
    `;
        const result = await pool.query(query);
        return result.rows || []; // Always return array
    } catch (error) {
        console.error('Database error:', error);
        return []; // Return empty array on error
    }
};

module.exports = { getAgingHD };