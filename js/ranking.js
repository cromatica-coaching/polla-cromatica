/* RankingService calcula tabla de posiciones en tiempo real desde partidos, pronósticos y campeón. */
window.RankingService = (() => {
  const getRealChampion = () => localStorage.getItem('pollaMundialista:realChampion') || '';
  const setRealChampion = team => localStorage.setItem('pollaMundialista:realChampion', team || '');

  const calculate = () => {
    const users = window.AuthService.getUsers();
    const matches = window.MatchService.getMatches();
    const predictions = window.PredictionService.getPredictions();
    const realChampion = getRealChampion();

    return users.map(user => {
      const matchPoints = predictions
        .filter(pred => pred.userId === user.id)
        .reduce((sum, pred) => {
          const match = matches.find(item => String(item.id) === String(pred.matchId));
          return sum + (match ? window.PredictionService.pointsForPrediction(pred, match) : 0);
        }, 0);
      const championPoints = window.PredictionService.championPoints(user.id, realChampion);
      const accuracy = window.PredictionService.accuracyForUser(user.id);
      return {
        userId: user.id,
        usuario: user.name,
        email: user.email,
        puntos: matchPoints + championPoints,
        puntosPartidos: matchPoints,
        puntosCampeon: championPoints,
        efectividad: accuracy.percentage,
        aciertos: accuracy.hits,
        evaluados: accuracy.evaluated
      };
    }).sort((a, b) => b.puntos - a.puntos || b.efectividad - a.efectividad || a.usuario.localeCompare(b.usuario));
  };

  const toCSV = ranking => {
    const rows = [['Posición', 'Usuario', 'Email', 'Puntos', 'Puntos partidos', 'Puntos campeón', 'Aciertos', 'Evaluados', 'Efectividad']];
    ranking.forEach((row, index) => rows.push([index + 1, row.usuario, row.email, row.puntos, row.puntosPartidos, row.puntosCampeon, row.aciertos, row.evaluados, `${row.efectividad}%`]));
    return rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  };

  const exportCSV = () => {
    const csv = toCSV(calculate());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-polla-mundialista-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { calculate, toCSV, exportCSV, getRealChampion, setRealChampion };
})();
