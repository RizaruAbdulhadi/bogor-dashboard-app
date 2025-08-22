const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pimpinan = sequelize.define('Pimpinan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'pimpinan',
    timestamps: false,
});

module.exports = Pimpinan;
