/**
 * pronosticos.js
 * Módulo de pronósticos de participantes
 * Polla Colombia
 */

const Pronosticos = (() => {
  // ── Abrir modal para pronosticar ──────────────────────────────

  const abrirModal = (partidoId) => {
    const partido = Storage.getPartido(partidoId);
    if (!partido || partido.estado !== 'abierto') {
      alert('Este partido no acepta pronósticos en este momento.');
      return;
    }

    const modal = document.getElementById('modal-pronostico');
    const form = document.getElementById('form-pronostico');
    const titulo = document.getElementById('modal-pronostico-titulo');
    const rival = document.getElementById('pronostico-rival-label');

    titulo.textContent = `Pronóstico · Colombia vs ${partido.rival}`;
    rival.textContent = partido.rival;

    form.elements['pronostico-nombre'].value = '';
    form.elements['goles-colombia'].value = '';
    form.elements['goles-rival'].value = '';
    form.elements['pronostico-partido-id'].value = partidoId;
    form.elements['pronostico-id'].value = '';

    // Info del partido
    document.getElementById('pronostico-info-fecha').textContent =
      Partidos.formatFecha(partido.fecha) + (partido.hora ? ` · ${partido.hora}` : '');
    document.getElementById('pronostico-info-valor').textContent =
      Partidos.formatMoneda(partido.valorParticipacion);

    modal.classList.add('modal--visible');
    form.elements['pronostico-nombre'].focus();
  };

  // ── Guardar pronóstico desde formulario ───────────────────────

  const guardarDesdeForm = (form) => {
    const partidoId = parseInt(form.elements['pronostico-partido-id'].value);
    const nombre = form.elements['pronostico-nombre'].value.trim();
    const golesColombia = parseInt(form.elements['goles-colombia'].value);
    const golesRival = parseInt(form.elements['goles-rival'].value);

    // Validaciones
    if (!nombre) {
      mostrarError(form, 'pronostico-nombre', 'El nombre es obligatorio.');
      return false;
    }
    if (isNaN(golesColombia) || golesColombia < 0) {
      mostrarError(form, 'goles-colombia', 'Ingresa un número válido (≥ 0).');
      return false;
    }
    if (isNaN(golesRival) || golesRival < 0) {
      mostrarError(form, 'goles-rival', 'Ingresa un número válido (≥ 0).');
      return false;
    }

    const partido = Storage.getPartido(partidoId);
    if (!partido || partido.estado !== 'abierto') {
      alert('El partido ya no acepta pronósticos.');
      return false;
    }

    // Verificar duplicado
    const existente = Storage.getPronosticoByNombre(partidoId, nombre);
    if (existente) {
      if (
        confirm(
          `Ya existe un pronóstico de "${nombre}" para este partido.\n¿Deseas modificarlo?`
        )
      ) {
        existente.golesColombia = golesColombia;
        existente.golesRival = golesRival;
        Storage.savePronostico(existente);
        cerrarModal();
        App.refresh();
        mostrarToast(`✅ Pronóstico de ${nombre} actualizado.`);
        return true;
      }
      return false;
    }

    const pronostico = {
      partidoId,
      nombre,
      golesColombia,
      golesRival,
    };

    Storage.savePronostico(pronostico);
    cerrarModal();
    App.refresh();
    mostrarToast(`✅ Pronóstico registrado para ${nombre}.`);
    return true;
  };

  const cerrarModal = () => {
    document.getElementById('modal-pronostico').classList.remove('modal--visible');
    limpiarErrores(document.getElementById('form-pronostico'));
  };

  // ── Modal de participantes (admin) ────────────────────────────

  const mostrarParticipantes = (partidoId) => {
    const partido = Storage.getPartido(partidoId);
    if (!partido) return;

    const pronosticos = Storage.getPronosticosByPartido(partidoId);
    const modal = document.getElementById('modal-participantes');
    const contenido = document.getElementById('participantes-contenido');

    document.getElementById('participantes-titulo').textContent =
      `Participantes · Colombia vs ${partido.rival}`;

    if (pronosticos.length === 0) {
      contenido.innerHTML = `<p class="empty-inline">Aún no hay pronósticos registrados.</p>`;
    } else {
      const filas = pronosticos
        .map(
          (pr, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${pr.nombre}</strong></td>
            <td class="pronostico-marcador">🇨🇴 ${pr.golesColombia} – ${pr.golesRival} 🆚</td>
            <td>${pr.fechaRegistro || '—'}</td>
            <td>
              <button class="btn-icon btn-icon--danger" title="Eliminar" 
                data-action="del-pronostico" data-id="${pr.id}">🗑️</button>
            </td>
          </tr>`
        )
        .join('');

      contenido.innerHTML = `
        <div class="participantes-header">
          <span>Total: <strong>${pronosticos.length}</strong></span>
          <span>Pozo: <strong>${Partidos.formatMoneda(pronosticos.length * partido.valorParticipacion)}</strong></span>
          <button class="btn btn--sm btn--outline" id="btn-export-csv" data-partido-id="${partidoId}">
            ⬇️ Exportar CSV
          </button>
        </div>
        <div class="table-wrap">
          <table class="tabla-participantes">
            <thead><tr><th>#</th><th>Nombre</th><th>Pronóstico</th><th>Fecha</th><th></th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>`;

      // Evento eliminar pronóstico
      contenido.querySelectorAll('[data-action="del-pronostico"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          const pr = Storage.getPronosticos().find((p) => p.id === id);
          if (pr && confirm(`¿Eliminar el pronóstico de ${pr.nombre}?`)) {
            Storage.deletePronostico(id);
            mostrarParticipantes(partidoId); // Refrescar modal
            App.refresh();
          }
        });
      });

      // Exportar CSV
      document.getElementById('btn-export-csv').addEventListener('click', () => {
        exportarCSV(partidoId);
      });
    }

    modal.classList.add('modal--visible');
  };

  const cerrarModalParticipantes = () => {
    document.getElementById('modal-participantes').classList.remove('modal--visible');
  };

  // ── Exportar CSV ──────────────────────────────────────────────

  const exportarCSV = (partidoId) => {
    const partido = Storage.getPartido(partidoId);
    const pronosticos = Storage.getPronosticosByPartido(partidoId);

    if (pronosticos.length === 0) {
      alert('No hay participantes para exportar.');
      return;
    }

    const encabezados = ['#', 'Nombre', 'Goles Colombia', 'Goles Rival', 'Fecha Registro'];
    const filas = pronosticos.map((pr, idx) => [
      idx + 1,
      pr.nombre,
      pr.golesColombia,
      pr.golesRival,
      pr.fechaRegistro || '',
    ]);

    const csv = [encabezados, ...filas]
      .map((row) => row.map((cel) => `"${cel}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polla-colombia-vs-${partido?.rival || 'partido'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('📥 CSV exportado correctamente.');
  };

  // ── Helpers de formulario ─────────────────────────────────────

  const mostrarError = (form, campo, msg) => {
    const input = form.elements[campo];
    if (!input) return;
    input.classList.add('input--error');
    let err = input.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      input.parentElement.appendChild(err);
    }
    err.textContent = msg;
    input.focus();
  };

  const limpiarErrores = (form) => {
    if (!form) return;
    form.querySelectorAll('.input--error').forEach((el) => el.classList.remove('input--error'));
    form.querySelectorAll('.field-error').forEach((el) => el.remove());
  };

  // ── Toast ─────────────────────────────────────────────────────

  const mostrarToast = (msg) => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('toast--visible');
    setTimeout(() => toast.classList.remove('toast--visible'), 3000);
  };

  // ── Export ────────────────────────────────────────────────────

  return {
    abrirModal,
    guardarDesdeForm,
    cerrarModal,
    mostrarParticipantes,
    cerrarModalParticipantes,
    exportarCSV,
    mostrarToast,
    limpiarErrores,
  };
})();
