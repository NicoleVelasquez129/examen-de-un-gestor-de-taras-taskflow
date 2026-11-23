const { Router } = require('express');
const {
  listar,
  detalle,
  crear,
  editar,
  eliminar,
  cambiarEstado,
} = require('../controllers/tareaController');

const router = Router();

router.get('/', listar);
router.get('/:id', detalle);
router.post('/', crear);
router.put('/:id', editar);
router.patch('/:id/estado', cambiarEstado);
router.delete('/:id', eliminar);

module.exports = router;