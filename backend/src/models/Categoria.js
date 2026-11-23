const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categoria = sequelize.define(
  'Categoria',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(200), allowNull: false },
    estado: {
      type: DataTypes.ENUM('ACTIVA', 'INACTIVA'),
      allowNull: false,
      defaultValue: 'ACTIVA',
    },
  },
  {
    tableName: 'categoria',
    timestamps: false,
  }
);

module.exports = Categoria;