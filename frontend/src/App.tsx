
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000/api';

type Categoria = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
};

type Tarea = {
  id: number;
  codigo_tarea: string;
  categoria_id: number;
  responsable: string;
  descripcion: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
  activo: boolean;
  categoria?: Categoria;
  fecha_registro?: string;
};

type Formulario = {
  responsable: string;
  categoria_id: string;
  descripcion: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
};

type Filtros = {
  texto: string;
  prioridad: string;
  estado: string;
};

const formularioInicial: Formulario = {
  responsable: '',
  categoria_id: '',
  descripcion: '',
  prioridad: 'MEDIA',
};

const filtrosIniciales: Filtros = {
  texto: '',
  prioridad: '',
  estado: '',
};

const transiciones: Record<string, string[]> = {
  PENDIENTE: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
};

function App() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formulario, setFormulario] =
    useState<Formulario>(formularioInicial);

  const [tareaEditando, setTareaEditando] =
    useState<number | null>(null);

  const [tareaDetalle, setTareaDetalle] =
    useState<Tarea | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] =
    useState<'exito' | 'error'>('exito');

  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);
  const [buscando, setBuscando] = useState(false);
  const filtrosActuales = useRef(filtrosIniciales);

  // Mostrar mensajes de respuesta
  const mostrarMensaje = useCallback((
    texto: string,
    tipo: 'exito' | 'error'
  ) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }, []);

  // Cargar tareas desde el backend
  const cargarTareas = useCallback(async (
    filtrosBusqueda?: Filtros
  ) => {
    try {
      setBuscando(true);

      const filtrosAplicados = filtrosBusqueda ?? filtrosActuales.current;
      const parametros = new URLSearchParams();

      if (filtrosAplicados.texto.trim()) {
        parametros.append('texto', filtrosAplicados.texto.trim());
      }

      if (filtrosAplicados.prioridad) {
        parametros.append('prioridad', filtrosAplicados.prioridad);
      }

      if (filtrosAplicados.estado) {
        parametros.append('estado', filtrosAplicados.estado);
      }

      const consulta = parametros.toString();
      const url = consulta
        ? `${API_URL}/tareas?${consulta}`
        : `${API_URL}/tareas`;
      const respuesta = await fetch(url);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudieron cargar las tareas');
      }

      setTareas(datos);
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'Error al buscar las tareas',
        'error'
      );
    } finally {
      setBuscando(false);
    }
  }, [mostrarMensaje]);

  // Cargar categorías desde el backend
  const cargarCategorias = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/categorias`);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudieron cargar las categorías');
      }

      setCategorias(datos);
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'Error al cargar las categorías',
        'error'
      );
    }
  }, [mostrarMensaje]);

  // Cargar datos al abrir la aplicación
  useEffect(() => {
    const iniciar = async () => {
      setCargandoDatos(true);
      await Promise.all([
        cargarTareas(),
        cargarCategorias(),
      ]);
      setCargandoDatos(false);
    };

    iniciar();
  }, [cargarCategorias, cargarTareas]);

  // Actualizar campos del formulario
  const cambiarCampo = (
    campo: keyof Formulario,
    valor: string
  ) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const cambiarFiltro = (
    campo: keyof Filtros,
    valor: string
  ) => {
    const siguientesFiltros = {
      ...filtrosActuales.current,
      [campo]: valor,
    };
    filtrosActuales.current = siguientesFiltros;
    setFiltros(siguientesFiltros);
  };

  const buscarTareas = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await cargarTareas(filtros);
  };

  const limpiarFiltros = async () => {
    filtrosActuales.current = filtrosIniciales;
    setFiltros(filtrosIniciales);
    await cargarTareas(filtrosIniciales);
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setTareaEditando(null);
  };

  // Registrar o editar una tarea
  const guardarTarea = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const datos = {
      categoria_id: Number(formulario.categoria_id),
      responsable: formulario.responsable.trim(),
      descripcion: formulario.descripcion.trim(),
      prioridad: formulario.prioridad,
    };

    if (
      !datos.categoria_id ||
      !datos.responsable ||
      datos.descripcion.length < 10
    ) {
      mostrarMensaje(
        'Completa correctamente todos los campos.',
        'error'
      );
      return;
    }

    try {
      setCargando(true);

      const esEdicion = tareaEditando !== null;

      const url = esEdicion
        ? `${API_URL}/tareas/${tareaEditando}`
        : `${API_URL}/tareas`;

      const respuesta = await fetch(url, {
        method: esEdicion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        const detalleErrores = Array.isArray(resultado.errores)
          ? resultado.errores.join('. ')
          : '';

        throw new Error(
          detalleErrores ||
          resultado.mensaje ||
          'No se pudo guardar la tarea'
        );
      }

      mostrarMensaje(
        resultado.mensaje ||
          (esEdicion
            ? 'Tarea actualizada correctamente'
            : 'Tarea registrada correctamente'),
        'exito'
      );

      limpiarFormulario();
      await cargarTareas();
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'Error al guardar la tarea',
        'error'
      );
    } finally {
      setCargando(false);
    }
  };

  // Consultar detalle de una tarea
  const verDetalle = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/tareas/${id}`);
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || 'No se pudo consultar la tarea');
      }

      setTareaDetalle(resultado);
    } catch (error) {
      mostrarMensaje(
        error instanceof Error ? error.message : 'Error al consultar',
        'error'
      );
    }
  };

  // Preparar formulario para editar
  const editarTarea = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/tareas/${id}`);
      const resultado: Tarea = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          (resultado as unknown as { mensaje?: string }).mensaje ||
          'No se pudo cargar la tarea'
        );
      }

      setFormulario({
        responsable: resultado.responsable,
        categoria_id: String(resultado.categoria_id),
        descripcion: resultado.descripcion,
        prioridad: resultado.prioridad,
      });

      setTareaEditando(id);
      setTareaDetalle(null);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      mostrarMensaje(
        error instanceof Error ? error.message : 'Error al editar',
        'error'
      );
    }
  };

  // Cambiar estado de una tarea
  const cambiarEstado = async (
    id: number,
    nuevoEstado: string
  ) => {
    try {
      const respuesta = await fetch(
        `${API_URL}/tareas/${id}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || 'No se pudo cambiar el estado'
        );
      }

      mostrarMensaje(resultado.mensaje, 'exito');
      await cargarTareas();
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'Error al cambiar el estado',
        'error'
      );
    }
  };

  // Eliminar lógicamente una tarea
  const eliminarTarea = async (id: number) => {
    const confirmar = window.confirm(
      '¿Estás segura de que deseas eliminar esta tarea?'
    );

    if (!confirmar) return;

    try {
      const respuesta = await fetch(
        `${API_URL}/tareas/${id}`,
        {
          method: 'DELETE',
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || 'No se pudo eliminar la tarea'
        );
      }

      mostrarMensaje(resultado.mensaje, 'exito');

      if (tareaEditando === id) {
        limpiarFormulario();
      }

      if (tareaDetalle?.id === id) {
        setTareaDetalle(null);
      }

      await cargarTareas();
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'Error al eliminar',
        'error'
      );
    }
  };

  const obtenerNombreCategoria = (tarea: Tarea) => {
    return tarea.categoria?.nombre ||
      categorias.find(c => c.id === tarea.categoria_id)?.nombre ||
      'Sin categoría';
  };

  const formatoEstado = (estado: string) => {
    return estado.replace('_', ' ');
  };

  return (
    <div className="app-container">

      {/* ENCABEZADO */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <h1>TaskFlow</h1>
        </div>

        <span className="header-label">
          Gestión de tareas
        </span>
      </header>

      <main className="main-content">

        <section className="welcome">
          <h2>Organiza tu trabajo</h2>
          <p>
            Administra tus actividades desde un solo lugar.
          </p>
        </section>

        {/* MENSAJES */}
        {mensaje && (
          <div
            className={`alert-message ${tipoMensaje}`}
            role="alert"
          >
            <span>{mensaje}</span>
            <button
              type="button"
              onClick={() => setMensaje('')}
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}

        {/* FORMULARIO */}
        <section className="panel">

          <div className="section-heading">
            <div>
              <h2>
                {tareaEditando
                  ? 'Editar tarea'
                  : 'Nueva tarea'}
              </h2>
            </div>
          </div>

          <form className="task-form" onSubmit={guardarTarea}>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="responsable">
                  Responsable
                </label>

                <input
                  id="responsable"
                  type="text"
                  minLength={3}
                  maxLength={100}
                  required
                  value={formulario.responsable}
                  onChange={(e) =>
                    cambiarCampo('responsable', e.target.value)
                  }
                  placeholder="Nombre del responsable"
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoria">
                  Categoría
                </label>

                <select
                  id="categoria"
                  required
                  value={formulario.categoria_id}
                  onChange={(e) =>
                    cambiarCampo('categoria_id', e.target.value)
                  }
                >
                  <option value="">
                    Selecciona una categoría
                  </option>

                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id}
                      value={categoria.id}
                    >
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="descripcion">
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  rows={4}
                  minLength={10}
                  maxLength={500}
                  required
                  value={formulario.descripcion}
                  onChange={(e) =>
                    cambiarCampo('descripcion', e.target.value)
                  }
                  placeholder="Describe la actividad..."
                />

                <small>
                  {formulario.descripcion.length}/500 caracteres
                </small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="prioridad">
                  Prioridad
                </label>

                <div className="priority-choices" role="group" aria-label="Prioridad">
                  {(['BAJA', 'MEDIA', 'ALTA'] as const).map((prioridad) => (
                    <button
                      key={prioridad}
                      type="button"
                      className={`priority-choice ${prioridad.toLowerCase()}${formulario.prioridad === prioridad ? ' selected' : ''}`}
                      aria-pressed={formulario.prioridad === prioridad}
                      onClick={() => cambiarCampo('prioridad', prioridad)}
                    >
                      {prioridad}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="form-actions">

              {tareaEditando !== null && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={limpiarFormulario}
                >
                  Cancelar edición
                </button>
              )}

              <button
                type="reset"
                className="btn-secondary"
                onClick={limpiarFormulario}
              >
                Limpiar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={cargando}
              >
                {cargando
                  ? 'Guardando...'
                  : tareaEditando !== null
                    ? 'Guardar cambios'
                    : '+ Registrar tarea'}
              </button>

            </div>
          </form>
        </section>

        {/* DETALLE */}
        {tareaDetalle && (
          <section className="panel detail-panel">
            <div className="section-heading">
              <div>
                <h2>Detalle de tarea</h2>
                <p>{tareaDetalle.codigo_tarea}</p>
              </div>

              <button
                className="btn-secondary"
                type="button"
                onClick={() => setTareaDetalle(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="detail-grid">
              <p>
                <strong>Responsable:</strong>{' '}
                {tareaDetalle.responsable}
              </p>

              <p>
                <strong>Categoría:</strong>{' '}
                {obtenerNombreCategoria(tareaDetalle)}
              </p>

              <p>
                <strong>Prioridad:</strong>{' '}
                {tareaDetalle.prioridad}
              </p>

              <p>
                <strong>Estado:</strong>{' '}
                {formatoEstado(tareaDetalle.estado)}
              </p>

              <p className="detail-description">
                <strong>Descripción:</strong><br />
                {tareaDetalle.descripcion}
              </p>
            </div>
          </section>
        )}

        {/* BÚSQUEDA Y FILTROS */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Buscar y filtrar tareas</h2>
              <p>
                Encuentra actividades según su texto, prioridad o estado.
              </p>
            </div>
          </div>

          <form className="filters-form" onSubmit={buscarTareas}>
            <div className="filters-grid">
              <div className="form-group">
                <label htmlFor="buscarTexto">Buscar por texto</label>
                <input
                  id="buscarTexto"
                  type="text"
                  placeholder="Código, responsable, descripción o categoría"
                  value={filtros.texto}
                  onChange={(e) => cambiarFiltro('texto', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="filtroPrioridad">Prioridad</label>
                <select
                  id="filtroPrioridad"
                  value={filtros.prioridad}
                  onChange={(e) => cambiarFiltro('prioridad', e.target.value)}
                >
                  <option value="">Todas las prioridades</option>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filtroEstado">Estado</label>
                <select
                  id="filtroEstado"
                  value={filtros.estado}
                  onChange={(e) => cambiarFiltro('estado', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En proceso</option>
                  <option value="COMPLETADA">Completada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="filter-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={buscando}
              >
                {buscando ? 'Buscando...' : 'Buscar tareas'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={limpiarFiltros}
                disabled={buscando}
              >
                Limpiar filtros
              </button>
            </div>
          </form>
        </section>

        {/* LISTADO */}
        <section className="panel">

          <div className="section-heading">
            <div>
              <h2>Listado de tareas</h2>
              <p>
                Consulta y administra tus actividades.
              </p>
            </div>

            <span className="task-counter">
              {tareas.length} tareas
            </span>
          </div>

          {cargandoDatos ? (
            <p className="loading-state">
              Cargando tareas...
            </p>
          ) : tareas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <strong>
                {filtros.texto || filtros.prioridad || filtros.estado
                  ? 'No se encontraron tareas'
                  : 'No hay tareas registradas'}
              </strong>
              <span>
                {filtros.texto || filtros.prioridad || filtros.estado
                  ? 'Prueba otros filtros o limpia la búsqueda.'
                  : 'Registra una nueva tarea para comenzar.'}
              </span>
            </div>
          ) : (

            <div className="table-container">
              <table className="task-table">

                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Responsable</th>
                    <th>Categoría</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {tareas.map((tarea) => (
                    <tr key={tarea.id}>

                      <td>
                        <strong>{tarea.codigo_tarea}</strong>
                      </td>

                      <td>{tarea.descripcion}</td>

                      <td>{tarea.responsable}</td>

                      <td>{obtenerNombreCategoria(tarea)}</td>

                      <td>
                        <span className={`badge-prioridad ${tarea.prioridad.toLowerCase()}`}>
                          {tarea.prioridad}
                        </span>
                      </td>

                      <td>
                        <span className={`badge-estado ${tarea.estado.toLowerCase()}`}>
                          {formatoEstado(tarea.estado)}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">

                          <button
                            type="button"
                            className="action-btn detail-btn"
                            onClick={() => verDetalle(tarea.id)}
                          >
                            Ver
                          </button>

                          <button
                            type="button"
                            className="action-btn edit-btn"
                            onClick={() => editarTarea(tarea.id)}
                          >
                            Editar
                          </button>

                          {transiciones[tarea.estado].length > 0 && (
                            <select
                              className="state-select"
                              aria-label={`Cambiar estado de ${tarea.codigo_tarea}`}
                              defaultValue=""
                              onChange={(e) => {
                                const nuevoEstado = e.target.value;
                                if (nuevoEstado) {
                                  cambiarEstado(tarea.id, nuevoEstado);
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="" disabled>
                                Cambiar estado
                              </option>

                              {transiciones[tarea.estado].map((estado) => (
                                <option key={estado} value={estado}>
                                  {formatoEstado(estado)}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            type="button"
                            className="action-btn delete-btn"
                            onClick={() => eliminarTarea(tarea.id)}
                          >
                            Eliminar
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </main>

      <footer className="footer">
        TaskFlow · Sistema de gestión de tareas
      </footer>

    </div>
  );
}

export default App;
