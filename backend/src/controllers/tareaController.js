const { Op } = require('sequelize');
const { Tarea, Categoria } = require('../models');

const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'];

// Flujo de estados permitido
const TRANSICIONES = {
  PENDIENTE: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
};

// Validación de datos en el servidor (se reutilizará al editar)
const validarDatos = async (body) => {
  const errores = [];

  const categoria_id = Number(body.categoria_id);
  const responsable = typeof body.responsable === 'string' ? body.responsable.trim() : '';
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
  const prioridad = body.prioridad;

  if (!Number.isInteger(categoria_id) || categoria_id <= 0) {
    errores.push('Debe seleccionar una categoría');
  } else {
    const categoria = await Categoria.findOne({
      where: { id: categoria_id, estado: 'ACTIVA' },
    });
    if (!categoria) {
      errores.push('La categoría seleccionada no existe o no está disponible');
    }
  }

  if (responsable.length < 3) {
    errores.push('El responsable es obligatorio y debe tener al menos 3 caracteres');
  } else if (responsable.length > 100) {
    errores.push('El responsable no puede superar los 100 caracteres');
  }

  if (descripcion.length < 10) {
    errores.push('La descripción es obligatoria y debe tener al menos 10 caracteres');
  } else if (descripcion.length > 500) {
    errores.push('La descripción no puede superar los 500 caracteres');
  }

  if (!PRIORIDADES.includes(prioridad)) {
    errores.push('La prioridad debe ser BAJA, MEDIA o ALTA');
  }

  return { errores, datos: { categoria_id, responsable, descripcion, prioridad } };
};

// Código automático: TAR-AAAAMMDD-XXX
const generarCodigo = async () => {
  const hoy = new Date();
  const fecha =
    `${hoy.getFullYear()}` +
    `${String(hoy.getMonth() + 1).padStart(2, '0')}` +
    `${String(hoy.getDate()).padStart(2, '0')}`;
  const prefijo = `TAR-${fecha}-`;

  const ultima = await Tarea.findOne({
    where: { codigo_tarea: { [Op.like]: `${prefijo}%` } },
    order: [['codigo_tarea', 'DESC']],
  });

  const siguiente = ultima ? Number(ultima.codigo_tarea.split('-')[2]) + 1 : 1;
  return `${prefijo}${String(siguiente).padStart(3, '0')}`;
};


// RF-01 y RF-07/RF-08: listar, buscar y filtrar tareas activas
const listar = async (req, res) => {

  // 1. Obtener los parámetros enviados desde la URL
  const parametroTexto = typeof req.query.q === 'string'
    ? req.query.q
    : req.query.texto;
  const texto = typeof parametroTexto === 'string'
    ? parametroTexto.trim()
    : '';

  const prioridad = typeof req.query.prioridad === 'string'
    ? req.query.prioridad.trim().toUpperCase()
    : '';

  const estado = typeof req.query.estado === 'string'
    ? req.query.estado.trim().toUpperCase()
    : '';

  const parametroCategoriaId = req.query.categoria_id;
  let categoriaId;

  if (parametroCategoriaId !== undefined) {
    const valorCategoriaId = typeof parametroCategoriaId === 'string'
      ? parametroCategoriaId.trim()
      : '';
    categoriaId = Number(valorCategoriaId);

    if (
      !/^\d+$/.test(valorCategoriaId) ||
      !Number.isSafeInteger(categoriaId) ||
      categoriaId <= 0
    ) {
      return res.status(400).json({
        mensaje: 'categoria_id debe ser un entero positivo válido',
      });
    }
  }

  // 2. Valores permitidos
  const prioridadesPermitidas = ['BAJA', 'MEDIA', 'ALTA'];

  const estadosPermitidos = [
    'PENDIENTE',
    'EN_PROCESO',
    'COMPLETADA',
    'CANCELADA'
  ];

  // 3. Validar prioridad
  if (prioridad && !prioridadesPermitidas.includes(prioridad)) {
    return res.status(400).json({
      mensaje: 'La prioridad debe ser BAJA, MEDIA o ALTA'
    });
  }

  // 4. Validar estado
  if (estado && !estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      mensaje: 'El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADA o CANCELADA'
    });
  }

  // 5. Condición inicial: solamente tareas activas
  const condiciones = [
    { activo: true }
  ];

  // 6. Aplicar filtro por prioridad
  if (prioridad) {
    condiciones.push({ prioridad });
  }

  // 7. Aplicar filtro por estado
  if (estado) {
    condiciones.push({ estado });
  }

  if (categoriaId !== undefined) {
    condiciones.push({ categoria_id: categoriaId });
  }

  // 8. Buscar por código, responsable, descripción o categoría
  if (texto) {
    const termino = `%${texto}%`;

    condiciones.push({
      [Op.or]: [
        { codigo_tarea: { [Op.like]: termino } },
        { responsable: { [Op.like]: termino } },
        { descripcion: { [Op.like]: termino } },
        { '$categoria.nombre$': { [Op.like]: termino } }
      ]
    });
  }

  // 9. Consultar la base de datos
  const tareas = await Tarea.findAll({
    where: {
      [Op.and]: condiciones
    },
    include: [
      {
        model: Categoria,
        as: 'categoria'
      }
    ],
    order: [
      ['fecha_registro', 'DESC']
    ]
  });

  // 10. Devolver resultados
  res.status(200).json(tareas);
};


// RF-03: consultar una tarea por ID
const detalle = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'El identificador no es válido' });
  }

  const tarea = await Tarea.findOne({
    where: { id, activo: true },
    include: [{ model: Categoria, as: 'categoria' }],
  });

  if (!tarea) {
    return res.status(404).json({ mensaje: 'La tarea no existe' });
  }

  res.json(tarea);
};

// RF-02: registrar una tarea
const crear = async (req, res) => {
  const body = req.body || {};
  const { errores, datos } = await validarDatos(body);

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores });
  }

  // Si dos solicitudes generan el mismo código a la vez, la restricción
  // UNIQUE de MySQL lo rechaza y se reintenta con un código nuevo
  let tarea = null;
  for (let intento = 0; intento < 3 && !tarea; intento++) {
    try {
      tarea = await Tarea.create({
        codigo_tarea: await generarCodigo(),
        categoria_id: datos.categoria_id,
        responsable: datos.responsable,
        descripcion: datos.descripcion,
        prioridad: datos.prioridad,
        estado: 'PENDIENTE',
        activo: true,
      });
    } catch (error) {
      if (error.name !== 'SequelizeUniqueConstraintError') throw error;
    }
  }

  if (!tarea) {
    return res
      .status(409)
      .json({ mensaje: 'No se pudo generar un código único, intente de nuevo' });
  }

  const creada = await Tarea.findByPk(tarea.id, {
    include: [{ model: Categoria, as: 'categoria' }],
  });

  res.status(201).json({ mensaje: 'Tarea registrada correctamente', tarea: creada });
};

// RF-04: editar los datos descriptivos de una tarea
const editar = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'El identificador no es válido' });
  }

  const tarea = await Tarea.findOne({ where: { id, activo: true } });

  if (!tarea) {
    return res.status(404).json({ mensaje: 'La tarea no existe' });
  }

  const { errores, datos } = await validarDatos(req.body || {});

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores });
  }

  // Solo se actualizan los datos descriptivos: nunca id, código,
  // estado ni fecha de registro
  await tarea.update({
    categoria_id: datos.categoria_id,
    responsable: datos.responsable,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad,
  });

  const actualizada = await Tarea.findByPk(tarea.id, {
    include: [{ model: Categoria, as: 'categoria' }],
  });

  res.json({ mensaje: 'Tarea actualizada correctamente', tarea: actualizada });
};

// RF-06: eliminación lógica (el registro NO se borra de la base de datos)
const eliminar = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'El identificador no es válido' });
  }

  const tarea = await Tarea.findOne({ where: { id, activo: true } });

  if (!tarea) {
    return res.status(404).json({ mensaje: 'La tarea no existe' });
  }

  await tarea.update({ activo: false });

  res.json({ mensaje: 'Tarea eliminada correctamente' });
};

// RF-05: cambiar el estado respetando el flujo permitido
const cambiarEstado = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'El identificador no es válido' });
  }

  const tarea = await Tarea.findOne({ where: { id, activo: true } });

  if (!tarea) {
    return res.status(404).json({ mensaje: 'La tarea no existe' });
  }

  const nuevoEstado = (req.body || {}).estado;

  if (!Object.keys(TRANSICIONES).includes(nuevoEstado)) {
    return res.status(400).json({
      mensaje: 'El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADA o CANCELADA',
    });
  }

  const permitidos = TRANSICIONES[tarea.estado];

  if (!permitidos.includes(nuevoEstado)) {
    const mensaje =
      permitidos.length === 0
        ? `La tarea está ${tarea.estado} y no admite más cambios de estado`
        : `Transición no permitida: de ${tarea.estado} a ${nuevoEstado}. ` +
          `Estados permitidos: ${permitidos.join(', ')}`;
    return res.status(409).json({ mensaje });
  }

  await tarea.update({ estado: nuevoEstado });

  const actualizada = await Tarea.findByPk(tarea.id, {
    include: [{ model: Categoria, as: 'categoria' }],
  });

  res.json({ mensaje: 'Estado actualizado correctamente', tarea: actualizada });
};

module.exports = { listar, detalle, crear, editar, eliminar, cambiarEstado };