const { Router } = require('express');
const { listar } = require('../controllers/categoriaController');

const router = Router();

router.get('/', listar);

module.exports = router;