/**
 * app.js
 * Controlador principal de la aplicación
 * Polla Colombia
 */

const App = (() => {
  // ── Estado de la app ──────────────────────────────────────────

  let _vistaActual = 'inicio';
  let _adminAutenticado = false;
  let _filtroEstado = 'todos';
  let _busqueda = '';

  // ── Inicialización ────────────────────────────────────────────

  const init = () => {
    Storage.seedDemo();
    _aplicarTema();
    _bindNav();
    _bindModals();
    _bindForms();
    _bindFiltros();
    _bindAdmin();
    _bindModo();
    navegarA('inicio');
  };

  // ── Navegación ────────────────────────────────────────────────

  const navegarA = (vista) => {
    _vistaActual = vista;

    document.querySelectorAll('.nav-link').forEach((l) => {
      l.classList.toggle('nav-link--active', l.dataset.vista === vista);
    });

    document.querySelectorAll('.vista').forEach((v) => {
      v.classList.toggle('vista--activa', v.id === `vista-${vista}`);
    });

    refresh();
  };

  const refresh = () => {
    switch (_vistaActual) {
      case 'inicio':
        _renderInicio();
        break;
      case 'admin':
        if (!_adminAutenticado) {
          _mostrarLoginAdmin();
        } else {
          _renderAdmin();
        }
        break;
      case 'historial':
        Resultados.renderHistorial(document.getElementById('historial-contenido'));
        break;
    }
  };

  // ── Vista inicio ──────────────────────────────────────────────

  const _renderInicio = () => {
    Partidos.renderCards(
      document.getElementById('partidos-grid'),
      _filtroEstado,
      _busqueda
    );
    _renderDashboardMini();
  };

  const _renderDashboardMini = () => {
    const el = document.getElementById('dashboard-mini');
    if (el) Partidos.renderDashboard(el);
  };

  // ── Vista admin ───────────────────────────────────────────────

  const _renderAdmin = () => {
    Partidos.renderAdminTabla(document.getElementById('admin-tabla-contenido'));
  };

  // ── Login admin ───────────────────────────────────────────────

  const _mostrarLoginAdmin = () => {
    const modal = document.getElementById('modal-admin-login');
    modal.classList.add('modal--visible');
    document.getElementById('admin-pin').value = '';
    setTimeout(() => document.getElementById('admin-pin').focus(), 100);
  };

  const _verificarPin = () => {
    const pin = document.getElementById('admin-pin').value;
    const settings = Storage.getSettings();
    if (pin === settings.adminPin) {
      _adminAutenticado = true;
      document.getElementById('modal-admin-login').classList.remove('modal--visible');
      document.getElementById('admin-pin-error').textContent = '';
      _renderAdmin();
      document.getElementById('btn-logout').style.display = 'inline-flex';
    } else {
      document.getElementById('admin-pin-error').textContent = 'PIN incorrecto. Inténtalo de nuevo.';
      document.getElementById('admin-pin').value = '';
      document.getElementById('admin-pin').focus();
    }
  };

  // ── Filtros y búsqueda ────────────────────────────────────────

  const _bindFiltros = () => {
    const busquedaInput = document.getElementById('busqueda-partido');
    if (busquedaInput) {
      busquedaInput.addEventListener('input', (e) => {
        _busqueda = e.target.value;
        if (_vistaActual === 'inicio') _renderInicio();
      });
    }

    document.querySelectorAll('[data-filtro]').forEach((btn) => {
      btn.addEventListener('click', () => {
        _filtroEstado = btn.dataset.filtro;
        document.querySelectorAll('[data-filtro]').forEach((b) =>
          b.classList.toggle('filtro--active', b === btn)
        );
        if (_vistaActual === 'inicio') _renderInicio();
      });
    });
  };

  // ── Modo oscuro ───────────────────────────────────────────────

  const _aplicarTema = () => {
    const settings = Storage.getSettings();
    document.documentElement.classList.toggle('dark', settings.darkMode);
    const btn = document.getElementById('btn-modo');
    if (btn) btn.textContent = settings.darkMode ? '☀️' : '🌙';
  };

  const _bindModo = () => {
    const btn = document.getElementById('btn-modo');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const settings = Storage.getSettings();
      settings.darkMode = !settings.darkMode;
      Storage.saveSettings(settings);
      _aplicarTema();
    });
  };

  // ── Navegación binding ────────────────────────────────────────

  const _bindNav = () => {
    document.querySelectorAll('[data-vista]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const vista = el.dataset.vista;
        if (vista === 'admin' && !_adminAutenticado) {
          _vistaActual = 'admin';
          _mostrarLoginAdmin();
          document.querySelectorAll('.nav-link').forEach((l) => {
            l.classList.toggle('nav-link--active', l.dataset.vista === 'admin');
          });
          document.querySelectorAll('.vista').forEach((v) => {
            v.classList.toggle('vista--activa', v.id === 'vista-admin');
          });
        } else {
          navegarA(vista);
        }
      });
    });
  };

  // ── Modales: cerrar con overlay o X ───────────────────────────

  const _bindModals = () => {
    document.querySelectorAll('.modal').forEach((modal) => {
      // Click en overlay (fondo)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) _cerrarTodosModales();
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', _cerrarTodosModales);
    });

    // ESC cierra modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') _cerrarTodosModales();
    });

    // Login admin: cancelar
    const btnCancelarLogin = document.getElementById('btn-cancelar-login');
    if (btnCancelarLogin) {
      btnCancelarLogin.addEventListener('click', () => {
        document.getElementById('modal-admin-login').classList.remove('modal--visible');
        navegarA('inicio');
      });
    }
  };

  const _cerrarTodosModales = () => {
    document.querySelectorAll('.modal--visible').forEach((m) =>
      m.classList.remove('modal--visible')
    );
  };

  // ── Formularios ───────────────────────────────────────────────

  const _bindForms = () => {
    // Form partido (admin)
    const formPartido = document.getElementById('form-partido');
    if (formPartido) {
      formPartido.addEventListener('submit', (e) => {
        e.preventDefault();
        Partidos.guardarDesdeForm(formPartido);
      });
    }

    // Form pronóstico (público)
    const formPronostico = document.getElementById('form-pronostico');
    if (formPronostico) {
      formPronostico.addEventListener('submit', (e) => {
        e.preventDefault();
        Pronosticos.guardarDesdeForm(formPronostico);
      });
    }

    // Form resultado (admin)
    const formResultado = document.getElementById('form-resultado');
    if (formResultado) {
      formResultado.addEventListener('submit', (e) => {
        e.preventDefault();
        Resultados.guardarResultadoDesdeForm(formResultado);
      });
    }

    // Login admin
    const formLogin = document.getElementById('form-admin-login');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        _verificarPin();
      });
    }

    // PIN: enter
    const pinInput = document.getElementById('admin-pin');
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') _verificarPin();
      });
    }
  };

  // ── Acciones admin ────────────────────────────────────────────

  const _bindAdmin = () => {
    // Botón nuevo partido
    const btnNuevoPartido = document.getElementById('btn-nuevo-partido');
    if (btnNuevoPartido) {
      btnNuevoPartido.addEventListener('click', () => Partidos.abrirModal());
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        _adminAutenticado = false;
        btnLogout.style.display = 'none';
        navegarA('inicio');
        Pronosticos.mostrarToast('Sesión de administrador cerrada.');
      });
    }

    // Cambiar PIN
    const btnCambiarPin = document.getElementById('btn-cambiar-pin');
    if (btnCambiarPin) {
      btnCambiarPin.addEventListener('click', () => {
        const nuevoPin = prompt('Ingresa el nuevo PIN de administrador (mínimo 4 dígitos):');
        if (nuevoPin && nuevoPin.length >= 4 && /^\d+$/.test(nuevoPin)) {
          const settings = Storage.getSettings();
          settings.adminPin = nuevoPin;
          Storage.saveSettings(settings);
          Pronosticos.mostrarToast('✅ PIN actualizado correctamente.');
        } else if (nuevoPin !== null) {
          alert('PIN inválido. Debe tener al menos 4 dígitos numéricos.');
        }
      });
    }
  };

  // ── Export ────────────────────────────────────────────────────

  return { init, refresh, navegarA };
})();

// ── Bootstrap ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
