const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Debitur = sequelize.define('Debitur', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nama_debitur: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'debitur',
    timestamps: false
});

module.exports = Debitur;
