# Polla Mundialista

Aplicación web completa en HTML5, CSS3 y JavaScript Vanilla para crear una quiniela mundialista.

## Cómo ejecutar

Abre `index.html` directamente en el navegador. No requiere instalación ni dependencias externas.

Usuario administrador demo:

- Email: `admin@polla.com`
- Contraseña: `123456`

## Estructura

```text
/index.html
/css/styles.css
/js/app.js
/js/auth.js
/js/partidos.js
/js/pronosticos.js
/js/ranking.js
/js/storage.js
/data/mundial.json
```

## Funcionalidades

- Registro, login, logout y sesión persistente en LocalStorage.
- CRUD de partidos para administrador.
- Importación masiva de partidos desde JSON.
- Pronósticos por usuario, editables antes del inicio del partido.
- Pronóstico del campeón.
- Sistema de puntos: marcador exacto +5, ganador/empate correcto +3, campeón correcto +10.
- Ranking automático con top 3 destacado.
- Dashboard con métricas generales y campeón más votado.
- Filtro por fase, búsqueda por equipo, modo oscuro, exportación CSV y estadísticas de efectividad.

## Nota de seguridad

El login usa LocalStorage y contraseñas en texto plano solo para fines de demo local. Para producción se debe usar backend, hashing de contraseñas, sesiones seguras y reglas de autorización reales.
