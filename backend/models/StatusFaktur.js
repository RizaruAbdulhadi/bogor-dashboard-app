const { DataTypes } = require('sequelize');
const db = require('../config/database');
const Kreditur = require('./Kreditur');

const StatusFaktur = db.define('status_faktur', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    kode_bm: DataTypes.STRING,
    nama_bm: DataTypes.STRING,
    kode_apotek: DataTypes.STRING,
    nama_apotek: DataTypes.STRING,
    kode_vendor: DataTypes.STRING,
    nama_vendor: DataTypes.STRING,
    no_faktur: DataTypes.STRING,
    tanggal_faktur: DataTypes.DATEONLY,
    nomor_penerimaan: DataTypes.STRING,
    tanggal_penerimaan: DataTypes.DATE,
    tanggal_terimafisik_faktur: DataTypes.DATEONLY,
    nomor_tukar_faktur: DataTypes.STRING,
    tanggal_tukarfaktur: DataTypes.DATEONLY,
    dpp: DataTypes.DECIMAL(15, 2),
    ppn: DataTypes.DECIMAL(15, 2),
    total: DataTypes.DECIMAL(15, 2),
    ap1: DataTypes.STRING,
    tanggal_ap1: DataTypes.DATEONLY,
    ap2: DataTypes.STRING,
    tanggal_ap2: DataTypes.DATEONLY,
    ap3: DataTypes.STRING,
    tanggal_ap3: DataTypes.DATEONLY,
    top: DataTypes.STRING,
    seri_pajak: DataTypes.STRING,
    tanggal_fakturpajak: DataTypes.DATEONLY,
    tanggal_laporpajak: DataTypes.DATEONLY,
    jenis: DataTypes.STRING,
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = StatusFaktur;
