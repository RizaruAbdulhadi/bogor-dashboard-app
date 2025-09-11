const { DataTypes } = require('sequelize');
const db = require('../config/database');

const DetailBeli = db.define('detail_beli', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bulan: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    kode_bm: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    nama_bm: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    kode_outlet: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    nama_outlet: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    nomor_penerimaan: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    tanggal_penerimaan: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tanggal_terima_fisik_faktur: {
        type: DataTypes.DATE,
        allowNull: true
    },
    kode_obat: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    nama_obat: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    satuan: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    isi_obat: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    kode_kreditur: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    nama_kreditur: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    kode_pabrik: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    nama_pabrik: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    kode_principle: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    nama_principle: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    qty_beli: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    jenis_kemasan: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    harga_satuan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    diskon_beli_1: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    diskon_beli_2: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    diskon_beli_3: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    jumlah_diskon: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    tipe_diskon: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    jenis_ppn: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    jumlah_netto: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    no_batch: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    exp_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    kode_dep: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    departemen: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    kode_group: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    group_nama: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    kode_kategory: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    kode_sub_kategory: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    subcategory: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    konsinyasi: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    pareto: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    nomor_po: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    tanggal_po: {
        type: DataTypes.DATE,
        allowNull: true
    },
    quantity_po: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    diskon_po_1: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    diskon_po_2: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    diskon_po_3: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    }
}, {
    tableName: 'detail_beli',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = DetailBeli;