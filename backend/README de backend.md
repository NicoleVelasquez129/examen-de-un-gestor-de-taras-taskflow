# TaskFlow - Backend (API REST)

API REST del módulo de tareas de TaskFlow. Sigue la arquitectura MVC/API:
modelos, controladores, rutas y configuración.

## Tecnologías
- Node.js
- Express 5
- Sequelize 6 (ORM) con MySQL (mysql2)
- cors y dotenv
- nodemon (solo desarrollo)

## Requisitos
- Node.js 18 o superior
- MySQL 8 y MySQL Workbench
- La base de datos `taskflow` creada con el script `../sql/taskflow.sql`

## Estructura
```
backend/
├── src/
│   ├── config/
│   │   └── database.js         conexión Sequelize (lee el .env)
│   ├── models/
│   │   ├── Categoria.js
│   │   ├── Tarea.js
│   │   └── index.js            relaciones entre modelos
│   ├── controllers/
│   │   ├── tareaController.js  lógica y validaciones de tareas
│   │   └── categoriaController.js
│   ├── routes/
│   │   ├── tareaRoutes.js
│   │   └── categoriaRoutes.js
│   └── app.js                  middlewares, rutas y manejo de errores
├── server.js                   arranque y comprobación de la conexión
├── .env.example                plantilla de variables de entorno
└── package.json
```

## Configuración y ejecución
1. Crear la base de datos ejecutando `sql/taskflow.sql` en MySQL Workbench
   (File > Open SQL Script > Execute).
2. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
3. Crear el archivo de variables de entorno a partir de la plantilla:
   ```bash
   # Windows
   copy .env.example .env
   # macOS / Linux
   cp .env.example .env
   ```
4. Abrir `.env` y completar `DB_PASSWORD` con la contraseña de MySQL.
5. Iniciar el servidor:
   ```bash
   npm run dev
   ```
6. Comprobar en el navegador `http://localhost:3000/api/salud`.
   Debe responder `{"mensaje":"TaskFlow API funcionando"}`.

### Variables de entorno
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3000 |
| DB_HOST | Servidor MySQL | localhost |
| DB_PORT | Puerto MySQL | 3306 |
| DB_NAME | Nombre de la base | taskflow |
| DB_USER | Usuario MySQL | root |
| DB_PASSWORD | Contraseña MySQL | (no se sube al repositorio) |

## Endpoints
| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | /api/salud | Comprueba que la API responde | 200 |
| GET | /api/categorias | Lista categorías activas | 200 |
| GET | /api/tareas | Lista tareas activas, con búsqueda y filtros | 200 |
| GET | /api/tareas/:id | Detalle de una tarea | 200, 400, 404 |
| POST | /api/tareas | Registra una tarea | 201, 400, 409 |
| PUT | /api/tareas/:id | Edita datos descriptivos | 200, 400, 404 |
| PATCH | /api/tareas/:id/estado | Cambia el estado | 200, 400, 404, 409 |
| DELETE | /api/tareas/:id | Eliminación lógica (activo = false) | 200, 400, 404 |

### Búsqueda y filtros (GET /api/tareas)
| Parámetro | Descripción |
|-----------|-------------|
| buscar | Texto: código, responsable o nombre de categoría (sin distinguir mayúsculas) |
| prioridad | BAJA, MEDIA o ALTA |
| estado | PENDIENTE, EN_PROCESO, COMPLETADA o CANCELADA |

Ejemplo: `GET /api/tareas?buscar=nicole&prioridad=ALTA&estado=PENDIENTE`

### Ejemplo: registrar una tarea
`POST /api/tareas`
```json
{
  "categoria_id": 1,
  "responsable": "Nicole",
  "descripcion": "Escribir el informe final del proyecto",
  "prioridad": "ALTA"
}
```
Respuesta `201`: la tarea creada con estado `PENDIENTE` y un código como
`TAR-20261123-004`.

### Ejemplo: cambiar el estado
`PATCH /api/tareas/1/estado`
```json
{ "estado": "EN_PROCESO" }
```

## Reglas de negocio
| Regla | Condición |
|-------|-----------|
| Categoría | Debe existir y estar ACTIVA |
| Responsable | Obligatorio, mínimo 3 caracteres sin espacios externos |
| Descripción | Obligatoria, mínimo 10 caracteres sin espacios externos |
| Prioridad | Solo BAJA, MEDIA o ALTA |
| Estado inicial | PENDIENTE |
| Código | Automático y único: TAR-AAAAMMDD-XXX |
| Edición | No cambia id, código, estado ni fecha de registro |
| Eliminación | Lógica: activo = false, el registro permanece en la base |

### Flujo de estados
| Estado actual | Puede pasar a |
|---------------|---------------|
| PENDIENTE | EN_PROCESO, CANCELADA |
| EN_PROCESO | COMPLETADA, CANCELADA |
| COMPLETADA | ninguno (estado final) |
| CANCELADA | ninguno (estado final) |

Una transición no permitida responde `409` y el estado no cambia.

## Seguridad básica
- Todas las validaciones se ejecutan en el servidor.
- Consultas con Sequelize (parametrizadas): no se concatena texto del usuario en SQL.
- Solo se leen los campos permitidos del cuerpo; `estado`, `codigo_tarea` y `activo` enviados por el cliente se ignoran al crear o editar.
- Las credenciales están en `.env`, que no se sube a Git (`.gitignore`).
- Los errores inesperados responden un mensaje genérico (500); el detalle solo se registra en la consola del servidor.
- Un JSON mal formado responde 400.