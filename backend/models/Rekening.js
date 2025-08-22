const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Rekening = sequelize.define('Rekening', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    bank: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nomor: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }
}, {
    tableName: 'rekening',
    timestamps: true,
});


module.exports = Rekening;
