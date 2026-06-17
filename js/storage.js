/* StorageService centraliza la persistencia en LocalStorage y evita repetir claves por toda la app. */
window.StorageService = (() => {
  const PREFIX = 'pollaMundialista:';
  const keys = {
    users: `${PREFIX}users`,
    session: `${PREFIX}session`,
    matches: `${PREFIX}matches`,
    predictions: `${PREFIX}predictions`,
    championVotes: `${PREFIX}championVotes`,
    theme: `${PREFIX}theme`,
    seeded: `${PREFIX}seeded`
  };

  const read = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error('Error leyendo LocalStorage:', error);
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error guardando LocalStorage:', error);
      return false;
    }
  };

  const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return { keys, read, write, uid };
})();
