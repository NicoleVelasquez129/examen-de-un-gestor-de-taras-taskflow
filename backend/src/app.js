const express = require('express');
const cors = require('cors');
const tareaRoutes = require('./routes/tareaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Ruta de prueba para comprobar que el servidor responde
app.get('/api/salud', (req, res) => {
  res.json({ mensaje: 'TaskFlow API funcionando' });
});

app.use('/api/tareas', tareaRoutes);
app.use('/api/categorias', categoriaRoutes);

// Ruta inexistente
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejo de errores: se registran en la consola del servidor,
// pero al usuario no se le muestran detalles internos
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' });
  }
  console.error(error);
  res.status(500).json({ mensaje: 'Ocurrió un error interno en el servidor' });
});

module.exports = app;