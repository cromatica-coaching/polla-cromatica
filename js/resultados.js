/**
 * resultados.js
 * Módulo de resultados y cálculo de ganadores
 * Polla Colombia
 */

const Resultados = (() => {
  // ── Calcular ganadores ────────────────────────────────────────

  const calcularGanadores = (partidoId) => {
    const partido = Storage.getPartido(partidoId);
    if (!partido || partido.resultadoColombia === null) return null;

    const pronosticos = Storage.getPronosticosByPartido(partidoId);
    const ganadores = pronosticos.filter(
      (pr) =>
        pr.golesColombia === partido.resultadoColombia &&
        pr.golesRival === partido.resultadoRival
    );

    const pozo = pronosticos.length * partido.valorParticipacion;
    const premioIndividual = ganadores.length > 0 ? Math.floor(pozo / ganadores.length) : 0;

    return {
      partido,
      pronosticos,
      ganadores,
      pozo,
      premioIndividual,
    };
  };

  // ── Modal de resultado (vista pública) ────────────────────────

  const mostrarModal = (partidoId) => {
    const data = calcularGanadores(partidoId);
    if (!data) {
      alert('Este partido aún no tiene resultado oficial.');
      return;
    }

    const { partido, pronosticos, ganadores, pozo, premioIndividual } = data;
    const modal = document.getElementById('modal-resultado');
    const contenido = document.getElementById('resultado-contenido');

    document.getElementById('resultado-titulo').textContent =
      `Resultado · Colombia vs ${partido.rival}`;

    // Sección marcador
    const marcadorHTML = `
      <div class="resultado-marcador">
        <div class="resultado-equipo">
          <span class="resultado-bandera">🇨🇴</span>
          <span class="resultado-nombre">Colombia</span>
          <span class="resultado-goles resultado-goles--col">${partido.resultadoColombia}</span>
        </div>
        <div class="resultado-vs">–</div>
        <div class="resultado-equipo">
          <span class="resultado-goles resultado-goles--riv">${partido.resultadoRival}</span>
          <span class="resultado-nombre">${partido.rival}</span>
          <span class="resultado-bandera">🆚</span>
        </div>
      </div>`;

    // Sección pozo
    const pozoHTML = `
      <div class="resultado-stats">
        <div class="rstat">
          <span class="rstat-num">${pronosticos.length}</span>
          <span class="rstat-label">Participantes</span>
        </div>
        <div class="rstat rstat--gold">
          <span class="rstat-num">${Partidos.formatMoneda(pozo)}</span>
          <span class="rstat-label">Pozo total</span>
        </div>
        <div class="rstat">
          <span class="rstat-num">${ganadores.length}</span>
          <span class="rstat-label">Ganadores</span>
        </div>
      </div>`;

    // Ganadores
    let ganadoresHTML = '';
    if (ganadores.length === 0) {
      ganadoresHTML = `
        <div class="sin-ganadores">
          <span class="sin-ganadores__icon">😔</span>
          <h3>Sin ganadores</h3>
          <p>Nadie acertó el marcador exacto <strong>${partido.resultadoColombia}–${partido.resultadoRival}</strong>.</p>
        </div>`;
    } else {
      const items = ganadores
        .map(
          (g) => `
          <div class="ganador-item">
            <span class="ganador-trophy">🏆</span>
            <span class="ganador-nombre">${g.nombre}</span>
            <span class="ganador-premio">${Partidos.formatMoneda(premioIndividual)}</span>
          </div>`
        )
        .join('');

      ganadoresHTML = `
        <div class="ganadores-section">
          <h3 class="ganadores-titulo">🥇 Ganadores</h3>
          <p class="ganadores-subtitulo">Premio individual: <strong>${Partidos.formatMoneda(premioIndividual)}</strong></p>
          <div class="ganadores-lista">${items}</div>
        </div>`;
    }

    // Tabla de todos los pronósticos
    const tablaHTML = _tablaPronosticos(pronosticos, partido);

    contenido.innerHTML = marcadorHTML + pozoHTML + ganadoresHTML + tablaHTML;
    modal.classList.add('modal--visible');
  };

  const _tablaPronosticos = (pronosticos, partido) => {
    if (pronosticos.length === 0) return '';

    const filas = pronosticos
      .map((pr) => {
        const acerto =
          partido.resultadoColombia !== null &&
          pr.golesColombia === partido.resultadoColombia &&
          pr.golesRival === partido.resultadoRival;
        const cls = acerto ? 'tr--winner' : '';
        return `
          <tr class="${cls}">
            <td>${acerto ? '🏆' : ''} ${pr.nombre}</td>
            <td class="pronostico-marcador">${pr.golesColombia} – ${pr.golesRival}</td>
            <td>${acerto ? '<span class="badge badge--open">Ganador</span>' : '—'}</td>
          </tr>`;
      })
      .join('');

    return `
      <div class="resultado-tabla-wrap">
        <h4>Todos los pronósticos</h4>
        <div class="table-wrap">
          <table class="tabla-participantes">
            <thead><tr><th>Participante</th><th>Pronóstico</th><th>Resultado</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>`;
  };

  const cerrarModal = () => {
    document.getElementById('modal-resultado').classList.remove('modal--visible');
  };

  // ── Modal registrar resultado (admin) ─────────────────────────

  const abrirModalAdmin = (partidoId) => {
    const partido = Storage.getPartido(partidoId);
    if (!partido) return;

    const modal = document.getElementById('modal-registrar-resultado');
    const form = document.getElementById('form-resultado');

    document.getElementById('registrar-resultado-titulo').textContent =
      `Registrar resultado · Colombia vs ${partido.rival}`;

    form.elements['resultado-partido-id'].value = partidoId;
    form.elements['resultado-colombia'].value = partido.resultadoColombia ?? '';
    form.elements['resultado-rival'].value = partido.resultadoRival ?? '';
    document.getElementById('resultado-rival-label').textContent = partido.rival;

    modal.classList.add('modal--visible');
    form.elements['resultado-colombia'].focus();
  };

  const guardarResultadoDesdeForm = (form) => {
    const partidoId = parseInt(form.elements['resultado-partido-id'].value);
    const resColombia = parseInt(form.elements['resultado-colombia'].value);
    const resRival = parseInt(form.elements['resultado-rival'].value);

    if (isNaN(resColombia) || resColombia < 0 || isNaN(resRival) || resRival < 0) {
      alert('Ingresa un resultado válido (números ≥ 0).');
      return false;
    }

    const partido = Storage.getPartido(partidoId);
    if (!partido) return false;

    partido.resultadoColombia = resColombia;
    partido.resultadoRival = resRival;
    partido.estado = 'finalizado';
    Storage.savePartido(partido);

    cerrarModalAdmin();
    App.refresh();

    // Mostrar resultado inmediatamente
    setTimeout(() => mostrarModal(partidoId), 300);

    Pronosticos.mostrarToast(`🏁 Resultado registrado: Colombia ${resColombia} – ${resRival} ${partido.rival}`);
    return true;
  };

  const cerrarModalAdmin = () => {
    document.getElementById('modal-registrar-resultado').classList.remove('modal--visible');
  };

  // ── Historial (vista pública) ─────────────────────────────────

  const renderHistorial = (contenedor) => {
    const partidos = Storage.getPartidos()
      .filter((p) => p.estado === 'finalizado')
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (partidos.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <h3>Sin historial</h3>
          <p>Los partidos finalizados aparecerán aquí.</p>
        </div>`;
      return;
    }

    const items = partidos
      .map((p) => {
        const { ganadores, pozo, premioIndividual } = calcularGanadores(p.id) || {};
        const ganadoresTexto =
          ganadores?.length > 0
            ? ganadores.map((g) => g.nombre).join(', ')
            : 'Sin ganadores';

        return `
          <div class="historial-item">
            <div class="historial-match">
              <span class="historial-equipos">🇨🇴 Colombia <strong>${p.resultadoColombia}</strong> – <strong>${p.resultadoRival}</strong> ${p.rival}</span>
              <span class="historial-fecha">${Partidos.formatFecha(p.fecha)}</span>
            </div>
            <div class="historial-meta">
              <span>👥 ${Storage.getPronosticosByPartido(p.id).length} participantes</span>
              <span>💰 ${Partidos.formatMoneda(pozo || 0)}</span>
              <span>🏆 ${ganadoresTexto}</span>
              ${ganadores?.length > 0 ? `<span class="historial-premio">Premio: ${Partidos.formatMoneda(premioIndividual || 0)}</span>` : ''}
            </div>
            <button class="btn btn--sm btn--outline" data-action="ver-resultado" data-id="${p.id}">
              Ver detalle
            </button>
          </div>`;
      })
      .join('');

    contenedor.innerHTML = `<div class="historial-lista">${items}</div>`;

    contenedor.querySelectorAll('[data-action="ver-resultado"]').forEach((btn) => {
      btn.addEventListener('click', () => mostrarModal(parseInt(btn.dataset.id)));
    });
  };

  // ── Export ────────────────────────────────────────────────────

  return {
    calcularGanadores,
    mostrarModal,
    cerrarModal,
    abrirModalAdmin,
    guardarResultadoDesdeForm,
    cerrarModalAdmin,
    renderHistorial,
  };
})();
