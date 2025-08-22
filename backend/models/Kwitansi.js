const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kwitansi = sequelize.define('Kwitansi', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nama_penjamin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    nomor_kwitansi: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nominal: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    terbilang: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nomor_rekening: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    pimpinan: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    outlet: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'kwitansi',
    timestamps: true,
});


module.exports = Kwitansi;
