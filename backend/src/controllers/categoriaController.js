const { Categoria } = require('../models');

// Categorías disponibles para el selector del formulario
const listar = async (req, res) => {
  const categorias = await Categoria.findAll({
    where: { estado: 'ACTIVA' },
    order: [['nombre', 'ASC']],
  });
  res.json(categorias);
};

module.exports = { listar };