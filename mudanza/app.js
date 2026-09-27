/* Brújula · Mudanza Coruña checklist PWA */
(function () {
  'use strict';

  const STORAGE_KEY = 'brujula-mudanza-coruna-v1';
  const WAITLIST_KEY = 'brujula-mudanza-waitlist-v1';

  const CATEGORIES = [
    {
      id: 'antes',
      title: 'Antes de mudarte',
      items: [
        {
          id: 'luz',
          label: 'Dar de baja o traspasar el contrato de luz',
          tip: 'Contacta tu comercializadora con el CUPS y la fecha de mudanza.'
        },
        {
          id: 'gas',
          label: 'Dar de baja o traspasar el gas (si aplica)',
          tip: 'Pide lectura final y conserva el contrato anterior unos días.'
        },
        {
          id: 'agua',
          label: 'Gestión de agua Emalcsa (alta / baja / cambio titular)',
          tip: 'Emalcsa gestiona el agua en A Coruña; revisa plazos en su web oficial.',
          href: 'https://www.emalcsa.es/',
          hrefLabel: 'emalcsa.es'
        },
        {
          id: 'fibra',
          label: 'Trasladar o dar de baja fibra / móvil',
          tip: 'Agenda la instalación en la vivienda nueva con antelación.'
        },
        {
          id: 'comunidad',
          label: 'Avisar a la comunidad / administración de finca',
          tip: 'Comunica fecha de salida y entrega de llaves de zonas comunes.'
        },
        {
          id: 'contratar-mudanza',
          label: 'Contratar empresa de mudanza o planificar ayuda',
          tip: 'Pide 2–3 presupuestos; mira seguros de mercancía.'
        },
        {
          id: 'embalaje',
          label: 'Conseguir cajas, film y material de embalaje',
          tip: 'Etiqueta por habitación; separa una caja «primeras 24 h».'
        },
        {
          id: 'docs',
          label: 'Carpeta de documentos (DNI/NIE, contratos, pólizas)',
          tip: 'Llévala contigo, no en el camión.'
        }
      ]
    },
    {
      id: 'dia',
      title: 'Día de la mudanza',
      items: [
        {
          id: 'ora',
          label: 'Reservar / gestionar ORA o zona de carga si hace falta',
          tip: 'En A Coruña la ORA regula aparcamiento en superficie; confirma zona y horario.',
          href: 'https://www.coruna.gal/',
          hrefLabel: 'coruna.gal'
        },
        {
          id: 'suelo',
          label: 'Proteger suelos, portales y ascensor',
          tip: 'Acuerda con la comunidad el uso del ascensor de mudanzas.'
        },
        {
          id: 'inventario',
          label: 'Inventario rápido / fotos de cajas frágiles',
          tip: 'Útil si hay seguro o reclamación.'
        },
        {
          id: 'llaves',
          label: 'Entrega y recepción de llaves (salida y entrada)',
          tip: 'Firma acta de entrega si alquilas; anota contadores.'
        },
        {
          id: 'contadores',
          label: 'Anotar lecturas de contadores (luz / agua / gas)',
          tip: 'Foto con fecha evita disputas de facturación.'
        }
      ]
    },
    {
      id: 'despues',
      title: 'Después de instalarte',
      items: [
        {
          id: 'padron',
          label: 'Empadronamiento en A Coruña (trámite oficial)',
          tip: 'Usa la guía Clarity de Brújula o la sede; no reconstruimos ese trámite aquí.',
          href: 'https://empadronamiento-coruna-clarity.netlify.app/',
          hrefLabel: 'Guía empadronamiento Brújula'
        },
        {
          id: 'banco',
          label: 'Cambiar domicilio en banco y aseguradoras',
          tip: 'App o oficina; revisa correspondencia postal.'
        },
        {
          id: 'ss',
          label: 'Actualizar domicilio en Seguridad Social / AEAT si aplica',
          tip: 'Sede electrónica o app; plazos según tu caso.'
        },
        {
          id: 'dgt',
          label: 'Actualizar domicilio en DGT / permiso de circulación',
          tip: 'Obligatorio si cambia tu domicilio fiscal/padronal según tu situación.'
        },
        {
          id: 'salud',
          label: 'Asignar o cambiar centro de salud',
          tip: 'SERGAS / tarjeta sanitaria según tu cobertura.'
        },
        {
          id: 'colegio',
          label: 'Colegios / comedor / actividades (si hay menores)',
          tip: 'Consulta plazos de escolarización en la Xunta / centro.'
        },
        {
          id: 'contratos',
          label: 'Actualizar contratos (trabajo, gimnasio, suscripciones)',
          tip: 'Cambia dirección de facturación para no perder avisos.'
        },
        {
          id: 'basura',
          label: 'Informarte de recogida de voluminosos / puntos limpios',
          tip: 'El Concello publica calendario de voluminosos por zona.'
        }
      ]
    }
  ];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function allItems() {
    return CATEGORIES.flatMap((c) => c.items.map((it) => ({ ...it, cat: c.id })));
  }

  function render() {
    const state = loadState();
    const root = document.getElementById('checklist');
    if (!root) return;
    root.innerHTML = '';

    CATEGORIES.forEach((cat) => {
      const section = document.createElement('section');
      section.className = 'card-block checklist-cat';
      section.dataset.cat = cat.id;

      const h2 = document.createElement('h2');
      h2.textContent = cat.title;
      section.appendChild(h2);

      const ul = document.createElement('ul');
      ul.className = 'check-list';
      ul.setAttribute('aria-label', cat.title);

      cat.items.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'check-item' + (state[item.id] ? ' done' : '');

        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!state[item.id];
        cb.dataset.id = item.id;
        cb.setAttribute('aria-describedby', 'tip-' + item.id);

        const text = document.createElement('span');
        text.className = 'check-label';
        text.textContent = item.label;

        label.appendChild(cb);
        label.appendChild(text);
        li.appendChild(label);

        if (item.tip || item.href) {
          const tip = document.createElement('p');
          tip.className = 'check-tip';
          tip.id = 'tip-' + item.id;
          tip.textContent = item.tip || '';
          if (item.href) {
            tip.appendChild(document.createTextNode(' '));
            const a = document.createElement('a');
            a.href = item.href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = item.hrefLabel || 'enlace';
            tip.appendChild(a);
          }
          li.appendChild(tip);
        }

        ul.appendChild(li);
      });

      section.appendChild(ul);
      root.appendChild(section);
    });

    updateProgress(state);
  }

  function updateProgress(state) {
    const items = allItems();
    const total = items.length;
    const done = items.filter((it) => state[it.id]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const label = document.getElementById('progress-label');
    const pctEl = document.getElementById('progress-pct');
    const fill = document.getElementById('progress-fill');
    const bar = document.getElementById('progress-bar');
    if (label) label.textContent = done + ' de ' + total + ' hechas';
    if (pctEl) pctEl.textContent = pct + '%';
    if (fill) fill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }

  function onCheckChange(e) {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'checkbox' || !t.dataset.id) return;
    const state = loadState();
    if (t.checked) state[t.dataset.id] = true;
    else delete state[t.dataset.id];
    saveState(state);
    const li = t.closest('.check-item');
    if (li) li.classList.toggle('done', t.checked);
    updateProgress(state);
  }

  function exportCsv() {
    const state = loadState();
    const rows = [['fase', 'id', 'tarea', 'hecho']];
    CATEGORIES.forEach((cat) => {
      cat.items.forEach((it) => {
        rows.push([
          cat.title,
          it.id,
          '"' + it.label.replace(/"/g, '""') + '"',
          state[it.id] ? 'si' : 'no'
        ]);
      });
    });
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mudanza-coruna-checklist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearProgress() {
    if (!confirm('¿Borrar todo el progreso guardado en este dispositivo?')) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  function loadWaitlist() {
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function initWaitlist() {
    const form = document.getElementById('waitlist-form');
    const status = document.getElementById('waitlist-status');
    const existing = loadWaitlist();
    if (existing && status) {
      status.hidden = false;
      status.textContent =
        'Guardado localmente: ' +
        (existing.name || '') +
        (existing.barrio ? ' · ' + existing.barrio : '') +
        (existing.fecha ? ' · ' + existing.fecha : '') +
        '. Escríbenos por Telegram cuando quieras activar el contacto.';
      const n = document.getElementById('wl-name');
      const b = document.getElementById('wl-barrio');
      const f = document.getElementById('wl-fecha');
      if (n) n.value = existing.name || '';
      if (b) b.value = existing.barrio || '';
      if (f) f.value = existing.fecha || '';
    }
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = (document.getElementById('wl-name') || {}).value || '';
      const barrio = (document.getElementById('wl-barrio') || {}).value || '';
      const fecha = (document.getElementById('wl-fecha') || {}).value || '';
      if (!name.trim() || !barrio.trim()) {
        if (status) {
          status.hidden = false;
          status.textContent = 'Nombre y barrio son obligatorios.';
        }
        return;
      }
      const payload = {
        name: name.trim(),
        barrio: barrio.trim(),
        fecha: fecha,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(payload));
      if (status) {
        status.hidden = false;
        status.textContent =
          'Guardado en este dispositivo. Abre Telegram Brújula para avisar cuando quieras que te pasemos a mudanzas locales.';
      }
    });
  }

  function init() {
    render();
    document.getElementById('checklist')?.addEventListener('change', onCheckChange);
    document.getElementById('btn-csv')?.addEventListener('click', exportCsv);
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
    document.getElementById('btn-clear')?.addEventListener('click', clearProgress);
    initWaitlist();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
