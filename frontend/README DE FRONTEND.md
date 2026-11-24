# TaskFlow - Frontend

Interfaz web de TaskFlow. Consume la API REST del backend para registrar,
consultar, editar, cambiar de estado, buscar, filtrar y eliminar lógicamente
tareas.

## Tecnologías
- React 19
- TypeScript
- Vite
- React Router DOM 7
- Tailwind CSS 3
- DaisyUI 4

## Requisitos
- Node.js 18 o superior
- El backend de TaskFlow en ejecución en `http://localhost:3000`
  (ver `../backend/README.md`)

## Ejecución
1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Iniciar la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
3. Abrir `http://localhost:5173` en el navegador.

Si la pantalla carga pero no muestra tareas, comprobar que el backend esté
corriendo y que `http://localhost:3000/api/tareas` responda.

## Scripts
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 5173) |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la compilación para revisarla |

## Estructura
```
frontend/
├── index.html
├── tailwind.config.js    Tailwind + plugin DaisyUI
├── postcss.config.js
├── vite.config.ts
└── src/
    ├── main.tsx          punto de entrada
    ├── App.tsx           pantalla principal
    ├── index.css         directivas de Tailwind
    └── ...               componentes y acceso a la API
```

## Funcionalidades
- Pantalla principal con título, formulario de registro y listado de tareas.
- Selección de la categoría desde una lista cargada del backend.
- Listado con código, categoría, responsable, prioridad, estado y fecha.
- Ver el detalle completo de una tarea.
- Editar los datos descriptivos de una tarea.
- Cambiar el estado: las transiciones no permitidas muestran una advertencia
  y el servidor las rechaza.
- Eliminar con confirmación previa (eliminación lógica).
- Búsqueda por texto y filtros por prioridad y estado.
- Mensajes de éxito, validación y error. El mensaje de éxito se muestra solo
  después de que el servidor responde.
- Los datos del usuario se muestran como texto (React escapa el contenido),
  por lo que no se interpretan como HTML ni JavaScript.

## Validaciones
El formulario repite las reglas del backend (responsable de 3 o más
caracteres, descripción de 10 o más, prioridad válida) para mejorar la
experiencia. La validación que protege los datos es la del servidor.