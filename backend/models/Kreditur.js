const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kreditur = sequelize.define('Kreditur', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    kode_kreditur: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nama_kreditur: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    jenis: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'kreditur',
    timestamps: false
});

module.exports = Kreditur;
