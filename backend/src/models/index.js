const sequelize = require('../config/database');
const Categoria = require('./Categoria');
const Tarea = require('./Tarea');

Categoria.hasMany(Tarea, { foreignKey: 'categoria_id', as: 'tareas' });
Tarea.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

module.exports = { sequelize, Categoria, Tarea };