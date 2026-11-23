const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarea = sequelize.define(
  'Tarea',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo_tarea: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    categoria_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    responsable: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(500), allowNull: false },
    prioridad: {
      type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'tarea',
    timestamps: true,
    createdAt: 'fecha_registro',
    updatedAt: 'fecha_actualizacion',
  }
);

module.exports = Tarea;