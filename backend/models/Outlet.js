const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Outlet = sequelize.define('Outlet', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    kode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nama_outlet: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'outlet',
    timestamps: false,
});

module.exports = Outlet;
