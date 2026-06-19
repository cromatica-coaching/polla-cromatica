/**
 * partidos.js
 * Módulo de gestión de partidos
 * Polla Colombia
 */

const Partidos = (() => {
  // ── Helpers de formato ────────────────────────────────────────

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    const [y, m, d] = fechaStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatMoneda = (valor) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);

  const estadoBadge = (estado) => {
    const map = {
      abierto: { label: 'Abierto', cls: 'badge--open' },
      cerrado: { label: 'Cerrado', cls: 'badge--closed' },
      finalizado: { label: 'Finalizado', cls: 'badge--done' },
    };
    const { label, cls } = map[estado] || { label: estado, cls: '' };
    return `<span class="badge ${cls}">${label}</span>`;
  };

  // ── Renderizado de tarjetas en vista pública ──────────────────

  const renderCards = (contenedor, filtroEstado = 'todos', busqueda = '') => {
    const partidos = Storage.getPartidos()
      .filter((p) => {
        const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
        const matchBusqueda = p.rival.toLowerCase().includes(busqueda.toLowerCase());
        return matchEstado && matchBusqueda;
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (partidos.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚽</span>
          <h3>No hay partidos disponibles</h3>
          <p>Ajusta los filtros o espera a que el administrador cree un partido.</p>
        </div>`;
      return;
    }

    contenedor.innerHTML = partidos.map((p) => _cardHTML(p)).join('');

    // Eventos en tarjetas
    contenedor.querySelectorAll('[data-action="pronosticar"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        Pronosticos.abrirModal(id);
      });
    });

    contenedor.querySelectorAll('[data-action="ver-resultado"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        Resultados.mostrarModal(id);
      });
    });
  };

  const _cardHTML = (p) => {
    const pronosticos = Storage.getPronosticosByPartido(p.id);
    const pozo = pronosticos.length * p.valorParticipacion;
    const esAbierto = p.estado === 'abierto';
    const esFinalizado = p.estado === 'finalizado';

    let marcador = '';
    if (esFinalizado && p.resultadoColombia !== null) {
      marcador = `
        <div class="card-marcador">
          <span class="marcador-col">${p.resultadoColombia}</span>
          <span class="marcador-sep">–</span>
          <span class="marcador-riv">${p.resultadoRival}</span>
        </div>`;
    }

    let accion = '';
    if (esAbierto) {
      accion = `<button class="btn btn--primary" data-action="pronosticar" data-id="${p.id}">
        ⚽ Registrar pronóstico
      </button>`;
    } else if (esFinalizado) {
      accion = `<button class="btn btn--outline" data-action="ver-resultado" data-id="${p.id}">
        🏆 Ver resultado
      </button>`;
    } else {
      accion = `<button class="btn btn--disabled" disabled>🔒 Pronósticos cerrados</button>`;
    }

    return `
      <article class="card partido-card">
        <div class="card-header">
          <div class="equipos">
            <span class="equipo equipo--col">🇨🇴 Colombia</span>
            <span class="vs">vs</span>
            <span class="equipo equipo--riv">🆚 ${p.rival}</span>
          </div>
          ${estadoBadge(p.estado)}
        </div>
        ${marcador}
        <div class="card-meta">
          <span>📅 ${formatFecha(p.fecha)} · ${p.hora || ''}</span>
          <span>👥 ${pronosticos.length} participantes</span>
        </div>
        <div class="card-pozo">
          <span class="pozo-label">Pozo total</span>
          <span class="pozo-valor">${formatMoneda(pozo)}</span>
        </div>
        <div class="card-participacion">
          Participación: <strong>${formatMoneda(p.valorParticipacion)}</strong>
        </div>
        <div class="card-actions">${accion}</div>
      </article>`;
  };

  // ── Panel admin: tabla de partidos ────────────────────────────

  const renderAdminTabla = (contenedor) => {
    const partidos = Storage.getPartidos().sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    if (partidos.length === 0) {
      contenedor.innerHTML = `<p class="empty-inline">Aún no hay partidos. Crea el primero.</p>`;
      return;
    }

    const filas = partidos
      .map((p) => {
        const pronosticos = Storage.getPronosticosByPartido(p.id);
        const pozo = pronosticos.length * p.valorParticipacion;
        const resultado =
          p.resultadoColombia !== null
            ? `${p.resultadoColombia} – ${p.resultadoRival}`
            : '—';

        return `
          <tr>
            <td data-label="Partido"><strong>Colombia vs ${p.rival}</strong></td>
            <td data-label="Fecha">${formatFecha(p.fecha)}</td>
            <td data-label="Estado">${estadoBadge(p.estado)}</td>
            <td data-label="Participantes">${pronosticos.length}</td>
            <td data-label="Pozo">${formatMoneda(pozo)}</td>
            <td data-label="Resultado">${resultado}</td>
            <td data-label="Acciones" class="td-actions">
              ${_accionesAdmin(p)}
            </td>
          </tr>`;
      })
      .join('');

    contenedor.innerHTML = `
      <table class="tabla-admin">
        <thead>
          <tr>
            <th>Partido</th><th>Fecha</th><th>Estado</th>
            <th>Participantes</th><th>Pozo</th><th>Resultado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>`;

    // Eventos de acciones
    contenedor.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        _handleAdminAction(action, id);
      });
    });
  };

  const _accionesAdmin = (p) => {
    const btns = [];

    btns.push(`<button class="btn-icon btn-icon--edit" title="Editar" data-action="editar" data-id="${p.id}">✏️</button>`);

    if (p.estado === 'abierto') {
      btns.push(`<button class="btn-icon btn-icon--warn" title="Cerrar apuestas" data-action="cerrar" data-id="${p.id}">🔒</button>`);
    } else if (p.estado === 'cerrado') {
      btns.push(`<button class="btn-icon btn-icon--success" title="Registrar resultado" data-action="resultado" data-id="${p.id}">🏁</button>`);
      btns.push(`<button class="btn-icon btn-icon--open" title="Abrir apuestas" data-action="abrir" data-id="${p.id}">🔓</button>`);
    } else if (p.estado === 'finalizado') {
      btns.push(`<button class="btn-icon btn-icon--info" title="Ver resultado" data-action="ver-resultado" data-id="${p.id}">👁️</button>`);
    }

    if (p.estado !== 'finalizado') {
      btns.push(`<button class="btn-icon btn-icon--info" title="Ver participantes" data-action="participantes" data-id="${p.id}">👥</button>`);
    }

    btns.push(`<button class="btn-icon btn-icon--danger" title="Eliminar" data-action="eliminar" data-id="${p.id}">🗑️</button>`);

    return btns.join('');
  };

  const _handleAdminAction = (action, id) => {
    const partido = Storage.getPartido(id);
    if (!partido) return;

    switch (action) {
      case 'editar':
        abrirModal(partido);
        break;
      case 'cerrar':
        if (confirm(`¿Cerrar apuestas para Colombia vs ${partido.rival}?`)) {
          partido.estado = 'cerrado';
          Storage.savePartido(partido);
          App.refresh();
        }
        break;
      case 'abrir':
        if (confirm(`¿Reabrir apuestas para Colombia vs ${partido.rival}?`)) {
          partido.estado = 'abierto';
          Storage.savePartido(partido);
          App.refresh();
        }
        break;
      case 'resultado':
        Resultados.abrirModalAdmin(id);
        break;
      case 'ver-resultado':
        Resultados.mostrarModal(id);
        break;
      case 'participantes':
        Pronosticos.mostrarParticipantes(id);
        break;
      case 'eliminar':
        if (confirm(`¿Eliminar el partido Colombia vs ${partido.rival}? Esta acción no se puede deshacer.`)) {
          Storage.deletePartido(id);
          App.refresh();
        }
        break;
    }
  };

  // ── Modal crear / editar partido ──────────────────────────────

  const abrirModal = (partido = null) => {
    const esEdicion = !!partido;
    const modal = document.getElementById('modal-partido');
    const form = document.getElementById('form-partido');
    const titulo = document.getElementById('modal-partido-titulo');

    titulo.textContent = esEdicion ? 'Editar partido' : 'Nuevo partido';

    form.elements['rival'].value = partido?.rival || '';
    form.elements['fecha'].value = partido?.fecha || '';
    form.elements['hora'].value = partido?.hora || '';
    form.elements['valorParticipacion'].value = partido?.valorParticipacion || '';
    form.elements['partidoId'].value = partido?.id || '';

    modal.classList.add('modal--visible');
  };

  const cerrarModal = () => {
    document.getElementById('modal-partido').classList.remove('modal--visible');
  };

  const guardarDesdeForm = (form) => {
    const id = form.elements['partidoId'].value;
    const rival = form.elements['rival'].value.trim();
    const fecha = form.elements['fecha'].value;
    const hora = form.elements['hora'].value;
    const valorParticipacion = parseInt(form.elements['valorParticipacion'].value);

    if (!rival || !fecha || !valorParticipacion || valorParticipacion <= 0) {
      alert('Por favor completa todos los campos correctamente.');
      return false;
    }

    const existente = id ? Storage.getPartido(parseInt(id)) : null;

    const partido = {
      ...(existente || {}),
      id: id ? parseInt(id) : undefined,
      rival,
      fecha,
      hora,
      valorParticipacion,
      estado: existente?.estado || 'abierto',
      resultadoColombia: existente?.resultadoColombia ?? null,
      resultadoRival: existente?.resultadoRival ?? null,
    };

    Storage.savePartido(partido);
    cerrarModal();
    App.refresh();
    return true;
  };

  // ── Dashboard stats ───────────────────────────────────────────

  const renderDashboard = (contenedor) => {
    const partidos = Storage.getPartidos();
    const abiertos = partidos.filter((p) => p.estado === 'abierto').length;
    const finalizados = partidos.filter((p) => p.estado === 'finalizado').length;
    const totalParticipantes = Storage.getPronosticos().length;

    // Partido más activo (abierto con más participantes)
    const activo = partidos
      .filter((p) => p.estado === 'abierto')
      .sort(
        (a, b) =>
          Storage.getPronosticosByPartido(b.id).length -
          Storage.getPronosticosByPartido(a.id).length
      )[0];

    const activoHTML = activo
      ? `<div class="dash-activo">
          <div class="dash-activo__teams">🇨🇴 Colombia vs ${activo.rival}</div>
          <div class="dash-activo__meta">
            ${formatFecha(activo.fecha)} · 
            ${Storage.getPronosticosByPartido(activo.id).length} participantes · 
            Pozo: ${formatMoneda(Storage.getPronosticosByPartido(activo.id).length * activo.valorParticipacion)}
          </div>
        </div>`
      : `<p class="dash-activo__empty">No hay partidos abiertos en este momento.</p>`;

    contenedor.innerHTML = `
      <div class="dash-stats">
        <div class="stat-card">
          <span class="stat-num">${partidos.length}</span>
          <span class="stat-label">Partidos totales</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${abiertos}</span>
          <span class="stat-label">Abiertos</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${finalizados}</span>
          <span class="stat-label">Finalizados</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${totalParticipantes}</span>
          <span class="stat-label">Pronósticos totales</span>
        </div>
      </div>
      <div class="dash-partido-activo">
        <h3>Partido activo</h3>
        ${activoHTML}
      </div>`;
  };

  // ── Export ────────────────────────────────────────────────────

  return {
    renderCards,
    renderAdminTabla,
    renderDashboard,
    abrirModal,
    cerrarModal,
    guardarDesdeForm,
    formatFecha,
    formatMoneda,
    estadoBadge,
  };
})();
