/**
 * storage.js
 * Módulo de persistencia con LocalStorage
 * Polla Colombia - Administración de partidos de la Selección
 */

const Storage = (() => {
  const KEYS = {
    PARTIDOS: 'pollaColombia_partidos',
    PRONOSTICOS: 'pollaColombia_pronosticos',
    SETTINGS: 'pollaColombia_settings',
  };

  // ── Utilidades ──────────────────────────────────────────────

  const _get = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`[Storage] Error leyendo "${key}":`, e);
      return null;
    }
  };

  const _set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[Storage] Error escribiendo "${key}":`, e);
      return false;
    }
  };

  const _nextId = (items) =>
    items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;

  // ── Partidos ─────────────────────────────────────────────────

  const getPartidos = () => _get(KEYS.PARTIDOS) || [];

  const getPartido = (id) => getPartidos().find((p) => p.id === id) || null;

  const savePartido = (partido) => {
    const partidos = getPartidos();
    if (partido.id) {
      const idx = partidos.findIndex((p) => p.id === partido.id);
      if (idx !== -1) partidos[idx] = partido;
      else partidos.push(partido);
    } else {
      partido.id = _nextId(partidos);
      partido.fechaCreacion = new Date().toISOString();
      partidos.push(partido);
    }
    _set(KEYS.PARTIDOS, partidos);
    return partido;
  };

  const deletePartido = (id) => {
    const partidos = getPartidos().filter((p) => p.id !== id);
    _set(KEYS.PARTIDOS, partidos);
    // Borrar pronósticos asociados
    const pronosticos = getPronosticos().filter((pr) => pr.partidoId !== id);
    _set(KEYS.PRONOSTICOS, pronosticos);
    return true;
  };

  // ── Pronósticos ───────────────────────────────────────────────

  const getPronosticos = () => _get(KEYS.PRONOSTICOS) || [];

  const getPronosticosByPartido = (partidoId) =>
    getPronosticos().filter((pr) => pr.partidoId === partidoId);

  const getPronosticoByNombre = (partidoId, nombre) =>
    getPronosticos().find(
      (pr) =>
        pr.partidoId === partidoId &&
        pr.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
    ) || null;

  const savePronostico = (pronostico) => {
    const pronosticos = getPronosticos();
    if (pronostico.id) {
      const idx = pronosticos.findIndex((pr) => pr.id === pronostico.id);
      if (idx !== -1) pronosticos[idx] = pronostico;
      else pronosticos.push(pronostico);
    } else {
      pronostico.id = _nextId(pronosticos);
      pronostico.fechaRegistro = new Date().toISOString().split('T')[0];
      pronosticos.push(pronostico);
    }
    _set(KEYS.PRONOSTICOS, pronosticos);
    return pronostico;
  };

  const deletePronostico = (id) => {
    const pronosticos = getPronosticos().filter((pr) => pr.id !== id);
    _set(KEYS.PRONOSTICOS, pronosticos);
    return true;
  };

  // ── Settings ──────────────────────────────────────────────────

  const getSettings = () =>
    _get(KEYS.SETTINGS) || { darkMode: false, adminPin: '1234' };

  const saveSettings = (settings) => {
    _set(KEYS.SETTINGS, settings);
    return settings;
  };

  // ── Seed de datos de ejemplo ──────────────────────────────────

  const seedDemo = () => {
    if (getPartidos().length > 0) return; // Ya hay datos

    const partidos = [
      {
        id: 1,
        rival: 'Brasil',
        fecha: '2026-06-20',
        hora: '20:00',
        valorParticipacion: 10000,
        estado: 'finalizado',
        resultadoColombia: 2,
        resultadoRival: 1,
        fechaCreacion: '2026-06-01T10:00:00.000Z',
      },
      {
        id: 2,
        rival: 'Argentina',
        fecha: '2026-06-25',
        hora: '18:00',
        valorParticipacion: 15000,
        estado: 'abierto',
        resultadoColombia: null,
        resultadoRival: null,
        fechaCreacion: '2026-06-10T10:00:00.000Z',
      },
    ];

    const pronosticos = [
      { id: 1, partidoId: 1, nombre: 'Juan Pérez', golesColombia: 2, golesRival: 1, fechaRegistro: '2026-06-15' },
      { id: 2, partidoId: 1, nombre: 'María García', golesColombia: 1, golesRival: 0, fechaRegistro: '2026-06-15' },
      { id: 3, partidoId: 1, nombre: 'Carlos López', golesColombia: 2, golesRival: 1, fechaRegistro: '2026-06-16' },
      { id: 4, partidoId: 1, nombre: 'Ana Torres', golesColombia: 3, golesRival: 0, fechaRegistro: '2026-06-16' },
      { id: 5, partidoId: 2, nombre: 'Pedro Ramírez', golesColombia: 1, golesRival: 1, fechaRegistro: '2026-06-20' },
    ];

    _set(KEYS.PARTIDOS, partidos);
    _set(KEYS.PRONOSTICOS, pronosticos);
  };

  // ── Export ────────────────────────────────────────────────────

  return {
    getPartidos,
    getPartido,
    savePartido,
    deletePartido,
    getPronosticos,
    getPronosticosByPartido,
    getPronosticoByNombre,
    savePronostico,
    deletePronostico,
    getSettings,
    saveSettings,
    seedDemo,
  };
})();
