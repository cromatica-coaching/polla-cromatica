/* MatchService contiene la lógica CRUD de partidos y filtros de consulta. */
window.MatchService = (() => {
  const { keys, read, write, uid } = window.StorageService;

  const getMatches = () => read(keys.matches, []);
  const saveMatches = matches => write(keys.matches, matches);
  const getById = id => getMatches().find(match => String(match.id) === String(id));

  const validateMatch = match => {
    const required = ['fase', 'fecha', 'equipoLocal', 'equipoVisitante'];
    required.forEach(field => {
      if (!match[field]) throw new Error(`El campo ${field} es obligatorio.`);
    });
    if (match.equipoLocal === match.equipoVisitante) throw new Error('Los equipos no pueden ser iguales.');
  };

  const create = data => {
    validateMatch(data);
    const matches = getMatches();
    const match = {
      id: uid('match'),
      fase: data.fase,
      fecha: data.fecha,
      equipoLocal: data.equipoLocal,
      equipoVisitante: data.equipoVisitante,
      resultadoReal: data.resultadoReal ?? null
    };
    matches.push(match);
    saveMatches(matches);
    return match;
  };

  const update = (id, data) => {
    validateMatch(data);
    const matches = getMatches();
    const index = matches.findIndex(match => String(match.id) === String(id));
    if (index < 0) throw new Error('Partido no encontrado.');
    matches[index] = { ...matches[index], ...data, id: matches[index].id };
    saveMatches(matches);
    return matches[index];
  };

  const remove = id => {
    const matches = getMatches().filter(match => String(match.id) !== String(id));
    saveMatches(matches);
    const predictions = window.PredictionService.getPredictions().filter(item => String(item.matchId) !== String(id));
    window.PredictionService.savePredictions(predictions);
  };

  const importMany = importedMatches => {
    if (!Array.isArray(importedMatches)) throw new Error('El JSON debe ser un arreglo de partidos.');
    const cleanMatches = importedMatches.map((match, index) => {
      validateMatch(match);
      return {
        id: match.id || uid(`match_${index}`),
        fase: match.fase,
        fecha: match.fecha,
        equipoLocal: match.equipoLocal,
        equipoVisitante: match.equipoVisitante,
        resultadoReal: match.resultadoReal ?? null
      };
    });
    saveMatches(cleanMatches);
    return cleanMatches;
  };

  const filtered = ({ fase = 'Todas', query = '' } = {}) => {
    const q = query.trim().toLowerCase();
    return getMatches().filter(match => {
      const faseOk = fase === 'Todas' || match.fase === fase;
      const queryOk = !q || [match.equipoLocal, match.equipoVisitante].some(team => team.toLowerCase().includes(q));
      return faseOk && queryOk;
    });
  };

  const isStarted = match => new Date(match.fecha).getTime() <= Date.now();
  const isFinished = match => Boolean(match.resultadoReal && Number.isFinite(Number(match.resultadoReal.local)) && Number.isFinite(Number(match.resultadoReal.visitante)));

  return { getMatches, saveMatches, getById, create, update, remove, importMany, filtered, isStarted, isFinished };
})();
