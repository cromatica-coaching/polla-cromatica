# Polla Mundialista

Aplicación web completa en HTML5, CSS3 y JavaScript Vanilla para crear una quiniela mundialista.

## Cómo ejecutar

Abre `index.html` directamente en el navegador. No requiere instalación ni dependencias externas.

Usuario administrador:

- Email: `david@cromaticacoaching.com`
- La contraseña inicial se mantiene igual a la versión anterior.

## Configuración inicial

La app inicia limpia, sin partidos masivos ni pronósticos ficticios. Solo queda cargado el partido de Colombia del 17 de junio de 2026:

- Uzbekistán vs Colombia
- Fase: Grupos · Grupo K
- Fecha: 2026-06-17 21:00, hora Colombia

Cuando un usuario registra su marcador, debe aceptar la apuesta de la polla por $20.000 COP. Sin esa aceptación no se guarda el pronóstico.

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
- Aceptación obligatoria de apuesta por $20.000 COP al guardar marcador.
- Pronóstico del campeón.
- Sistema de puntos: marcador exacto +5, ganador/empate correcto +3, campeón correcto +10.
- Ranking automático con top 3 destacado.
- Dashboard con métricas generales y campeón más votado.
- Filtro por fase, búsqueda por equipo, modo oscuro, exportación CSV y estadísticas de efectividad.

## Nota de seguridad

El login usa LocalStorage y contraseñas en texto plano solo para fines de demo local. Para producción se debe usar backend, hashing de contraseñas, sesiones seguras y reglas de autorización reales.
