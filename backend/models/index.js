const sequelize = require('../config/database');
const User = require('./User');
const Kwitansi = require('./Kwitansi');
const Rekening = require('./Rekening');
const pool = require('../config/database');
const Kreditur = require('./Kreditur');
const StatusFaktur = require('./StatusFaktur');

// --- RELASI KWITANSI & REKENING ---
Rekening.hasMany(Kwitansi, {
    foreignKey: 'nomor_rekening',
    sourceKey: 'nomor',
    as: 'kwitansi',
});

Kwitansi.belongsTo(Rekening, {
    foreignKey: 'nomor_rekening',
    targetKey: 'nomor',
    as: 'rekening',
});

// --- RELASI KREDITUR & STATUS_FAKTUR (kode_kreditur = kode_vendor) ---
Kreditur.hasMany(StatusFaktur, {
    foreignKey: 'kode_vendor',
    sourceKey: 'kode_kreditur',
    as: 'statusFaktur'
});

StatusFaktur.belongsTo(Kreditur, {
    foreignKey: 'kode_vendor',
    targetKey: 'kode_kreditur',
    as: 'kreditur'
});

// Sinkronisasi DB (opsional: bisa kamu pindah ke tempat lain)
sequelize.sync({ alter: false })
    .then(() => console.log('Database synced'))
    .catch(err => console.error('DB sync error:', err));

// Export semua model
module.exports = {
    pool,
    sequelize,
    User,
    Kwitansi,
    Rekening,
    Kreditur,
    StatusFaktur
};
