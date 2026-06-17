/* App controla la UI, el ruteo de vistas y la siembra de datos demo. */
window.App = (() => {
  const teams = [
    'Argentina', 'España', 'Brasil', 'Francia', 'Alemania', 'Inglaterra', 'Portugal', 'Uruguay',
    'Colombia', 'México', 'Estados Unidos', 'Canadá', 'Japón', 'Corea del Sur', 'Marruecos', 'Senegal',
    'Países Bajos', 'Bélgica', 'Croacia', 'Italia', 'Suiza', 'Dinamarca', 'Polonia', 'Serbia',
    'Chile', 'Ecuador', 'Perú', 'Costa Rica', 'Australia', 'Ghana', 'Nigeria', 'Camerún'
  ];

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const state = { view: 'dashboard', filters: { fase: 'Todas', query: '' } };

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const formatDate = iso => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  const scoreText = result => result ? `${result.local} - ${result.visitante}` : 'Pendiente';

  const notify = message => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3200);
  };

  const openModal = html => {
    $('#modalBody').innerHTML = html;
    $('#modal').classList.remove('hidden');
  };
  const closeModal = () => $('#modal').classList.add('hidden');

  const createSeedMatches = () => {
    const groups = Array.from({ length: 8 }, (_, index) => teams.slice(index * 4, index * 4 + 4));
    const dates = ['2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'];
    let id = 1;
    const matches = [];
    groups.forEach((group, groupIndex) => {
      const pairs = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
      pairs.forEach((pair, pairIndex) => {
        const day = dates[(groupIndex + pairIndex) % dates.length];
        matches.push({
          id: id++,
          fase: 'Grupos',
          fecha: `${day}T${String(12 + (pairIndex % 4) * 2).padStart(2, '0')}:00:00`,
          equipoLocal: group[pair[0]],
          equipoVisitante: group[pair[1]],
          resultadoReal: id <= 10 ? { local: pairIndex % 3, visitante: (pairIndex + groupIndex) % 3 } : null
        });
      });
    });
    return matches;
  };

  const seedDemoData = () => {
    const { keys, read, write } = window.StorageService;
    if (read(keys.seeded, false)) return;

    const users = [
      { id: 'admin', name: 'Administrador', email: 'admin@polla.com', password: '123456', role: 'admin', createdAt: new Date().toISOString() },
      { id: 'user_lina', name: 'Lina Torres', email: 'lina@demo.com', password: '123456', role: 'user', createdAt: new Date().toISOString() },
      { id: 'user_carlos', name: 'Carlos Mejía', email: 'carlos@demo.com', password: '123456', role: 'user', createdAt: new Date().toISOString() },
      { id: 'user_maria', name: 'María Gómez', email: 'maria@demo.com', password: '123456', role: 'user', createdAt: new Date().toISOString() }
    ];
    const matches = createSeedMatches();
    const predictions = [];
    users.slice(1).forEach((user, userIndex) => {
      matches.slice(0, 16).forEach((match, matchIndex) => {
        predictions.push({
          id: `seed_pred_${user.id}_${match.id}`,
          userId: user.id,
          matchId: match.id,
          local: (matchIndex + userIndex) % 4,
          visitante: (matchIndex + userIndex + 1) % 3,
          updatedAt: new Date().toISOString()
        });
      });
    });
    const championVotes = [
      { id: 'champ_lina', userId: 'user_lina', campeon: 'Argentina', updatedAt: new Date().toISOString() },
      { id: 'champ_carlos', userId: 'user_carlos', campeon: 'Brasil', updatedAt: new Date().toISOString() },
      { id: 'champ_maria', userId: 'user_maria', campeon: 'Argentina', updatedAt: new Date().toISOString() }
    ];

    write(keys.users, users);
    write(keys.matches, matches);
    write(keys.predictions, predictions);
    write(keys.championVotes, championVotes);
    write(keys.seeded, true);
  };

  const setView = view => {
    state.view = view;
    $$('.view').forEach(item => item.classList.add('hidden'));
    $(`#${view}View`).classList.remove('hidden');
    $$('.nav-link').forEach(item => item.classList.toggle('active', item.dataset.view === view));
    $('#viewTitle').textContent = ({ dashboard: 'Dashboard', partidos: 'Partidos', pronosticos: 'Pronósticos', campeon: 'Campeón del Mundial', ranking: 'Ranking general', admin: 'Administración' })[view];
    render();
  };

  const updateShell = () => {
    const user = window.AuthService.getCurrentUser();
    const logged = Boolean(user);
    $('#authView').classList.toggle('hidden', logged);
    $('#appView').classList.toggle('hidden', !logged);
    $('#sidebar').classList.toggle('hidden', !logged);
    $('#logoutBtn').classList.toggle('hidden', !logged);
    if (user) {
      $('#userBadge').textContent = `${user.name} · ${user.role === 'admin' ? 'Admin' : 'Jugador'}`;
      $('#welcomeText').textContent = `Hola, ${user.name}. Tu objetivo: precisión, estrategia y algo de intuición futbolera.`;
      $$('.admin-only').forEach(item => item.classList.toggle('hidden', user.role !== 'admin'));
      if (state.view === 'admin' && user.role !== 'admin') setView('dashboard');
      else render();
    }
  };

  const statCard = (label, value) => `<article class="stat card"><small>${label}</small><strong>${value}</strong></article>`;

  const renderDashboard = () => {
    const users = window.AuthService.getUsers();
    const matches = window.MatchService.getMatches();
    const finished = matches.filter(window.MatchService.isFinished).length;
    const champion = window.PredictionService.championMostVoted();
    $('#dashboardView').innerHTML = `
      <div class="grid grid--stats">
        ${statCard('Usuarios', users.length)}
        ${statCard('Partidos', matches.length)}
        ${statCard('Pendientes', matches.length - finished)}
        ${statCard('Finalizados', finished)}
      </div>
      <div class="grid grid--two" style="margin-top:1rem;">
        <section class="card">
          <h2>Ranking general</h2>
          ${rankingTable(window.RankingService.calculate().slice(0, 5), true)}
        </section>
        <section class="card">
          <h2>Campeón más votado</h2>
          <p class="badge badge--gold">${champion ? `${escapeHTML(champion.equipo)} · ${champion.votos} votos` : 'Aún sin votos'}</p>
          <h3>Reglas de puntos</h3>
          <p>Marcador exacto +5, ganador o empate correcto +3, campeón correcto +10.</p>
        </section>
      </div>`;
  };

  const matchCard = (match, mode = 'list') => {
    const finished = window.MatchService.isFinished(match);
    const started = window.MatchService.isStarted(match);
    const user = window.AuthService.getCurrentUser();
    const prediction = user ? window.PredictionService.getUserPrediction(user.id, match.id) : null;
    return `<article class="card match-card">
      <div class="match-meta"><span>${escapeHTML(match.fase)}</span><span>${formatDate(match.fecha)}</span></div>
      <div class="teams"><span>${escapeHTML(match.equipoLocal)}</span><strong class="score">${scoreText(match.resultadoReal)}</strong><span>${escapeHTML(match.equipoVisitante)}</span></div>
      <div class="actions">
        <span class="badge ${finished ? 'badge--green' : 'badge--muted'}">${finished ? 'Finalizado' : started ? 'En curso / cerrado' : 'Abierto'}</span>
        ${prediction ? `<span class="badge badge--gold">Tu pronóstico: ${prediction.local}-${prediction.visitante}</span>` : '<span class="badge badge--muted">Sin pronóstico</span>'}
      </div>
      ${mode === 'predict' ? `<button class="btn btn--secondary" data-predict="${match.id}" ${started ? 'disabled' : ''}>${prediction ? 'Editar pronóstico' : 'Pronosticar'}</button>` : ''}
      ${mode === 'admin' ? `<div class="actions"><button class="btn btn--small btn--secondary" data-edit-match="${match.id}">Editar</button><button class="btn btn--small btn--danger" data-delete-match="${match.id}">Eliminar</button></div>` : ''}
    </article>`;
  };

  const filterToolbar = () => {
    const phases = ['Todas', ...new Set(window.MatchService.getMatches().map(match => match.fase))];
    return `<div class="toolbar">
      <div class="filters">
        <select id="faseFilter">${phases.map(phase => `<option ${state.filters.fase === phase ? 'selected' : ''}>${escapeHTML(phase)}</option>`).join('')}</select>
        <input id="teamSearch" type="search" placeholder="Buscar equipo" value="${escapeHTML(state.filters.query)}" />
      </div>
    </div>`;
  };

  const renderPartidos = () => {
    const matches = window.MatchService.filtered(state.filters);
    $('#partidosView').innerHTML = `${filterToolbar()}<div class="grid grid--cards">${matches.map(match => matchCard(match)).join('') || '<div class="empty card">No hay partidos con esos filtros.</div>'}</div>`;
  };

  const renderPronosticos = () => {
    const matches = window.MatchService.filtered(state.filters);
    $('#pronosticosView').innerHTML = `${filterToolbar()}<div class="grid grid--cards">${matches.map(match => matchCard(match, 'predict')).join('') || '<div class="empty card">No hay partidos disponibles.</div>'}</div>`;
  };

  const renderChampion = () => {
    const user = window.AuthService.getCurrentUser();
    const selected = window.PredictionService.getUserChampion(user.id)?.campeon || '';
    $('#campeonView').innerHTML = `<section class="card">
      <h2>Selecciona tu campeón</h2>
      <p>Este pronóstico suma 10 puntos si aciertas al campeón real registrado por administración.</p>
      <form class="form" id="championForm">
        <label>Campeón
          <select id="championSelect" required>
            <option value="">Selecciona una selección</option>
            ${teams.map(team => `<option ${selected === team ? 'selected' : ''}>${team}</option>`).join('')}
          </select>
        </label>
        <button class="btn btn--primary" type="submit">Guardar campeón</button>
      </form>
    </section>`;
  };

  const rankingTable = (ranking, compact = false) => `<div class="table-card"><table>
    <thead><tr><th>Posición</th><th>Usuario</th><th>Puntos</th>${compact ? '' : '<th>Aciertos</th><th>Efectividad</th><th>Detalle</th>'}</tr></thead>
    <tbody>${ranking.map((row, index) => `<tr class="${index < 3 ? `top-${index + 1}` : ''}">
      <td>${index + 1}</td><td>${escapeHTML(row.usuario)}</td><td><strong>${row.puntos}</strong></td>${compact ? '' : `<td>${row.aciertos}/${row.evaluados}</td><td>${row.efectividad}%</td><td>${row.puntosPartidos} partidos + ${row.puntosCampeon} campeón</td>`}
    </tr>`).join('') || '<tr><td colspan="6">Sin usuarios</td></tr>'}</tbody>
  </table></div>`;

  const renderRanking = () => {
    const ranking = window.RankingService.calculate();
    $('#rankingView').innerHTML = `<div class="toolbar"><button class="btn btn--primary" id="exportRanking">Exportar ranking CSV</button></div>${rankingTable(ranking)}`;
  };

  const matchForm = (match = {}) => `<form class="form" id="matchForm" data-id="${escapeHTML(match.id || '')}">
    <h2>${match.id ? 'Editar partido' : 'Crear partido'}</h2>
    <div class="form-row"><label>Fase<input id="matchFase" required value="${escapeHTML(match.fase || 'Grupos')}" /></label><label>Fecha<input id="matchFecha" type="datetime-local" required value="${match.fecha ? match.fecha.slice(0, 16) : ''}" /></label></div>
    <div class="form-row"><label>Local<input id="matchLocal" required value="${escapeHTML(match.equipoLocal || '')}" /></label><label>Visitante<input id="matchVisitante" required value="${escapeHTML(match.equipoVisitante || '')}" /></label></div>
    <div class="form-row"><label>Goles local<input id="realLocal" type="number" min="0" value="${match.resultadoReal?.local ?? ''}" placeholder="Vacío si pendiente" /></label><label>Goles visitante<input id="realVisitante" type="number" min="0" value="${match.resultadoReal?.visitante ?? ''}" placeholder="Vacío si pendiente" /></label></div>
    <button class="btn btn--primary" type="submit">Guardar partido</button>
  </form>`;

  const renderAdmin = () => {
    const user = window.AuthService.getCurrentUser();
    if (user.role !== 'admin') return setView('dashboard');
    const matches = window.MatchService.filtered(state.filters);
    const realChampion = window.RankingService.getRealChampion();
    $('#adminView').innerHTML = `
      <div class="toolbar">
        <div class="actions"><button class="btn btn--primary" id="newMatch">Crear partido</button><button class="btn btn--secondary" id="importJsonBtn">Importar JSON</button></div>
      </div>
      <section class="card" style="margin-bottom:1rem;">
        <form class="form" id="realChampionForm">
          <label>Campeón real para sumar +10
            <select id="realChampionSelect"><option value="">Pendiente</option>${teams.map(team => `<option ${realChampion === team ? 'selected' : ''}>${team}</option>`).join('')}</select>
          </label>
          <button class="btn btn--primary" type="submit">Guardar campeón real</button>
        </form>
      </section>
      ${filterToolbar()}
      <div class="grid grid--cards">${matches.map(match => matchCard(match, 'admin')).join('')}</div>
      <input type="file" id="jsonFileInput" accept="application/json" class="hidden" />`;
  };

  const render = () => {
    if (!window.AuthService.getCurrentUser()) return;
    const map = { dashboard: renderDashboard, partidos: renderPartidos, pronosticos: renderPronosticos, campeon: renderChampion, ranking: renderRanking, admin: renderAdmin };
    map[state.view]?.();
  };

  const getMatchPayloadFromForm = () => {
    const realLocal = $('#realLocal').value;
    const realVisitante = $('#realVisitante').value;
    return {
      fase: $('#matchFase').value.trim(),
      fecha: $('#matchFecha').value,
      equipoLocal: $('#matchLocal').value.trim(),
      equipoVisitante: $('#matchVisitante').value.trim(),
      resultadoReal: realLocal !== '' && realVisitante !== '' ? { local: Number(realLocal), visitante: Number(realVisitante) } : null
    };
  };

  const bindEvents = () => {
    document.addEventListener('click', event => {
      const target = event.target;
      if (target.matches('[data-close-modal]')) closeModal();
      if (target.matches('[data-auth-tab]')) {
        $$('.tab').forEach(tab => tab.classList.toggle('active', tab === target));
        $('#loginForm').classList.toggle('hidden', target.dataset.authTab !== 'login');
        $('#registerForm').classList.toggle('hidden', target.dataset.authTab !== 'register');
      }
      if (target.matches('.nav-link')) setView(target.dataset.view);
      if (target.id === 'logoutBtn') { window.AuthService.logout(); updateShell(); notify('Sesión cerrada.'); }
      if (target.id === 'themeToggle') toggleTheme();
      if (target.dataset.predict) showPredictionModal(target.dataset.predict);
      if (target.id === 'newMatch') openModal(matchForm());
      if (target.dataset.editMatch) openModal(matchForm(window.MatchService.getById(target.dataset.editMatch)));
      if (target.dataset.deleteMatch && confirm('¿Eliminar este partido y sus pronósticos?')) { window.MatchService.remove(target.dataset.deleteMatch); render(); notify('Partido eliminado.'); }
      if (target.id === 'exportRanking') window.RankingService.exportCSV();
      if (target.id === 'importJsonBtn') $('#jsonFileInput').click();
    });

    document.addEventListener('input', event => {
      if (event.target.id === 'teamSearch') { state.filters.query = event.target.value; render(); }
    });
    document.addEventListener('change', event => {
      if (event.target.id === 'faseFilter') { state.filters.fase = event.target.value; render(); }
      if (event.target.id === 'jsonFileInput') importJsonFile(event.target.files[0]);
    });

    document.addEventListener('submit', event => {
      event.preventDefault();
      try {
        if (event.target.id === 'loginForm') {
          window.AuthService.login({ email: $('#loginEmail').value, password: $('#loginPassword').value });
          updateShell(); setView('dashboard'); notify('Bienvenido de nuevo.');
        }
        if (event.target.id === 'registerForm') {
          window.AuthService.register({ name: $('#registerName').value, email: $('#registerEmail').value, password: $('#registerPassword').value });
          updateShell(); setView('dashboard'); notify('Cuenta creada.');
        }
        if (event.target.id === 'predictionForm') {
          const user = window.AuthService.getCurrentUser();
          window.PredictionService.upsertPrediction({ userId: user.id, matchId: event.target.dataset.matchId, local: $('#predLocal').value, visitante: $('#predVisitante').value });
          closeModal(); render(); notify('Pronóstico guardado.');
        }
        if (event.target.id === 'championForm') {
          const user = window.AuthService.getCurrentUser();
          window.PredictionService.upsertChampion({ userId: user.id, campeon: $('#championSelect').value });
          render(); notify('Campeón guardado.');
        }
        if (event.target.id === 'matchForm') {
          const id = event.target.dataset.id;
          const payload = getMatchPayloadFromForm();
          id ? window.MatchService.update(id, payload) : window.MatchService.create(payload);
          closeModal(); render(); notify('Partido guardado.');
        }
        if (event.target.id === 'realChampionForm') {
          window.RankingService.setRealChampion($('#realChampionSelect').value);
          render(); notify('Campeón real actualizado.');
        }
      } catch (error) {
        notify(error.message);
      }
    });
  };

  const showPredictionModal = matchId => {
    const user = window.AuthService.getCurrentUser();
    const match = window.MatchService.getById(matchId);
    const prediction = window.PredictionService.getUserPrediction(user.id, matchId) || {};
    openModal(`<form class="form" id="predictionForm" data-match-id="${matchId}">
      <h2>${escapeHTML(match.equipoLocal)} vs ${escapeHTML(match.equipoVisitante)}</h2>
      <p>${formatDate(match.fecha)} · ${escapeHTML(match.fase)}</p>
      <div class="form-row">
        <label>Goles ${escapeHTML(match.equipoLocal)}<input id="predLocal" type="number" min="0" required value="${prediction.local ?? ''}" /></label>
        <label>Goles ${escapeHTML(match.equipoVisitante)}<input id="predVisitante" type="number" min="0" required value="${prediction.visitante ?? ''}" /></label>
      </div>
      <button class="btn btn--primary" type="submit">Guardar pronóstico</button>
    </form>`);
  };

  const importJsonFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const matches = Array.isArray(data) ? data : data.partidos;
        window.MatchService.importMany(matches);
        render(); notify('Partidos importados correctamente.');
      } catch (error) {
        notify(`No se pudo importar: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const toggleTheme = () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    document.body.classList.toggle('dark', next === 'dark');
    window.StorageService.write(window.StorageService.keys.theme, next);
    $('#themeToggle').textContent = next === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro';
  };

  const applyTheme = () => {
    const theme = window.StorageService.read(window.StorageService.keys.theme, 'light');
    document.body.classList.toggle('dark', theme === 'dark');
    $('#themeToggle').textContent = theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro';
  };

  const init = () => {
    seedDemoData();
    applyTheme();
    bindEvents();
    updateShell();
  };

  return { init, createSeedMatches };
})();

document.addEventListener('DOMContentLoaded', window.App.init);
