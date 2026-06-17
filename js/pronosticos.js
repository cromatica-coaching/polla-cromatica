/* PredictionService administra pronósticos de partidos, campeón y estadísticas de aciertos. */
window.PredictionService = (() => {
  const { keys, read, write, uid } = window.StorageService;

  const getPredictions = () => read(keys.predictions, []);
  const savePredictions = predictions => write(keys.predictions, predictions);
  const getChampionVotes = () => read(keys.championVotes, []);
  const saveChampionVotes = votes => write(keys.championVotes, votes);

  const getUserPrediction = (userId, matchId) => getPredictions().find(item => item.userId === userId && String(item.matchId) === String(matchId));
  const getUserChampion = userId => getChampionVotes().find(item => item.userId === userId) || null;

  const upsertPrediction = ({ userId, matchId, local, visitante, aceptaApuesta }) => {
    const match = window.MatchService.getById(matchId);
    if (!match) throw new Error('Partido no encontrado.');
    if (window.MatchService.isStarted(match)) throw new Error('El partido ya inició. No puedes modificar este pronóstico.');

    const parsedLocal = Number(local);
    const parsedVisitante = Number(visitante);
    if (!Number.isInteger(parsedLocal) || !Number.isInteger(parsedVisitante) || parsedLocal < 0 || parsedVisitante < 0) {
      throw new Error('Ingresa marcadores válidos.');
    }
    if (!aceptaApuesta) {
      throw new Error('Debes aceptar la apuesta de $20.000 COP para guardar tu polla.');
    }

    const predictions = getPredictions();
    const index = predictions.findIndex(item => item.userId === userId && String(item.matchId) === String(matchId));
    const payload = {
      id: index >= 0 ? predictions[index].id : uid('pred'),
      userId,
      matchId,
      local: parsedLocal,
      visitante: parsedVisitante,
      aceptaApuesta: true,
      valorApuestaCOP: 20000,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) predictions[index] = payload;
    else predictions.push(payload);
    savePredictions(predictions);
    return payload;
  };

  const upsertChampion = ({ userId, campeon }) => {
    if (!campeon) throw new Error('Selecciona un campeón.');
    const votes = getChampionVotes();
    const index = votes.findIndex(item => item.userId === userId);
    const payload = { id: index >= 0 ? votes[index].id : uid('champ'), userId, campeon, updatedAt: new Date().toISOString() };
    if (index >= 0) votes[index] = payload;
    else votes.push(payload);
    saveChampionVotes(votes);
    return payload;
  };

  const getWinner = (local, visitante) => {
    if (local > visitante) return 'local';
    if (local < visitante) return 'visitante';
    return 'empate';
  };

  const pointsForPrediction = (prediction, match) => {
    if (!prediction || !window.MatchService.isFinished(match)) return 0;
    const realLocal = Number(match.resultadoReal.local);
    const realVisitante = Number(match.resultadoReal.visitante);
    if (prediction.local === realLocal && prediction.visitante === realVisitante) return 5;
    const predictedWinner = getWinner(prediction.local, prediction.visitante);
    const realWinner = getWinner(realLocal, realVisitante);
    return predictedWinner === realWinner ? 3 : 0;
  };

  const championPoints = (userId, realChampion) => {
    const vote = getUserChampion(userId);
    return realChampion && vote?.campeon === realChampion ? 10 : 0;
  };

  const championMostVoted = () => {
    const counts = getChampionVotes().reduce((acc, vote) => {
      acc[vote.campeon] = (acc[vote.campeon] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { equipo: sorted[0][0], votos: sorted[0][1] } : null;
  };

  const accuracyForUser = userId => {
    const matches = window.MatchService.getMatches().filter(window.MatchService.isFinished);
    const predictions = getPredictions().filter(item => item.userId === userId);
    const evaluated = predictions.filter(pred => matches.some(match => String(match.id) === String(pred.matchId)));
    const hits = evaluated.filter(pred => pointsForPrediction(pred, window.MatchService.getById(pred.matchId)) > 0).length;
    return {
      evaluated: evaluated.length,
      hits,
      percentage: evaluated.length ? Math.round((hits / evaluated.length) * 100) : 0
    };
  };

  return {
    getPredictions,
    savePredictions,
    getChampionVotes,
    saveChampionVotes,
    getUserPrediction,
    getUserChampion,
    upsertPrediction,
    upsertChampion,
    pointsForPrediction,
    championPoints,
    championMostVoted,
    accuracyForUser
  };
})();
