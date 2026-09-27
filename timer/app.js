/* Brújula · Registro jornada timer — localStorage PoC */
(function () {
  'use strict';
  const KEY = 'brujula-rj-v1';
  const TZ = 'Europe/Madrid';

  const $ = (sel) => document.querySelector(sel);

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { worker: '', punches: [], openIn: null };
      const d = JSON.parse(raw);
      return {
        worker: d.worker || '',
        punches: Array.isArray(d.punches) ? d.punches : [],
        openIn: d.openIn || null
      };
    } catch {
      return { worker: '', punches: [], openIn: null };
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify({
      worker: state.worker,
      punches: state.punches,
      openIn: state.openIn
    }));
  }

  function nowMs() { return Date.now(); }

  function fmtTime(ms) {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date(ms));
  }

  function fmtDate(ms) {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(ms));
  }

  function ymdInMadrid(ms) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(ms));
    const get = (t) => parts.find((p) => p.type === t).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function mondayOfWeek(ms) {
    // Find Monday 00:00 Madrid of the week containing ms
    const ymd = ymdInMadrid(ms);
    const [y, m, d] = ymd.split('-').map(Number);
    // Use noon UTC proxy then adjust via weekday in Madrid
    const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(probe);
    const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    const offset = map[wd] ?? 0;
    const mon = new Date(probe.getTime() - offset * 86400000);
    const my = mon.getUTCFullYear(), mm = mon.getUTCMonth(), md = mon.getUTCDate();
    // Approximate Monday range: return list of 7 YMD starting Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(Date.UTC(my, mm, md + i, 12, 0, 0));
      days.push(ymdInMadrid(dt.getTime()));
    }
    return days;
  }

  function elapsedLabel(fromMs, toMs) {
    let s = Math.max(0, Math.floor((toMs - fromMs) / 1000));
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function msBetween(a, b) { return Math.max(0, b - a); }

  let state = load();
  let tickTimer = null;

  function render() {
    const nameEl = $('#worker-name');
    if (nameEl && document.activeElement !== nameEl) nameEl.value = state.worker;

    const inOpen = !!state.openIn;
    $('#status-pill').textContent = inOpen ? 'Fichado · EN jornada' : 'Fuera · sin fichaje abierto';
    $('#status-pill').classList.toggle('out', !inOpen);
    $('#btn-in').disabled = inOpen;
    $('#btn-out').disabled = !inOpen;

    const now = nowMs();
    if (inOpen) {
      $('#clock-face').textContent = elapsedLabel(state.openIn, now);
      $('#clock-sub').textContent = `Entrada ${fmtTime(state.openIn)} · ${fmtDate(state.openIn)}`;
    } else {
      $('#clock-face').textContent = '00:00:00';
      $('#clock-sub').textContent = 'Pulsa Entrada para empezar el registro de hoy';
    }

    // Today punches
    const today = ymdInMadrid(now);
    const todayRows = state.punches.filter((p) => ymdInMadrid(p.in) === today);
    const tbody = $('#today-body');
    tbody.innerHTML = '';
    if (!todayRows.length && !inOpen) {
      $('#today-empty').hidden = false;
    } else {
      $('#today-empty').hidden = true;
      todayRows.forEach((p) => {
        const tr = document.createElement('tr');
        const dur = p.out ? elapsedLabel(p.in, p.out) : '—';
        tr.innerHTML = `<td>${fmtTime(p.in)}</td><td>${p.out ? fmtTime(p.out) : '…'}</td><td>${dur}</td>`;
        tbody.appendChild(tr);
      });
      if (inOpen && ymdInMadrid(state.openIn) === today) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${fmtTime(state.openIn)}</td><td>…</td><td>${elapsedLabel(state.openIn, now)}</td>`;
        tbody.appendChild(tr);
      }
    }

    // Week table
    const days = mondayOfWeek(now);
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const wbody = $('#week-body');
    wbody.innerHTML = '';
    let weekMs = 0;
    days.forEach((ymd, i) => {
      const dayPunches = state.punches.filter((p) => ymdInMadrid(p.in) === ymd && p.out);
      let dayMs = dayPunches.reduce((acc, p) => acc + msBetween(p.in, p.out), 0);
      if (inOpen && ymdInMadrid(state.openIn) === ymd) dayMs += msBetween(state.openIn, now);
      weekMs += dayMs;
      const first = dayPunches[0];
      const last = dayPunches[dayPunches.length - 1];
      const inStr = first ? fmtTime(first.in) : (inOpen && ymdInMadrid(state.openIn) === ymd ? fmtTime(state.openIn) : '—');
      const outStr = last && last.out ? fmtTime(last.out) : (inOpen && ymdInMadrid(state.openIn) === ymd ? '…' : '—');
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${labels[i]} ${ymd.slice(8)}/${ymd.slice(5, 7)}</td><td>${inStr}</td><td>${outStr}</td><td>${dayMs ? elapsedLabel(0, dayMs) : '—'}</td>`;
      wbody.appendChild(tr);
    });
    $('#week-total').textContent = weekMs ? elapsedLabel(0, weekMs) : '—';
  }

  function punchIn() {
    if (state.openIn) return;
    state.worker = ($('#worker-name').value || '').trim();
    state.openIn = nowMs();
    save(state);
    render();
  }

  function punchOut() {
    if (!state.openIn) return;
    const out = nowMs();
    state.punches.push({ in: state.openIn, out, worker: state.worker });
    state.openIn = null;
    save(state);
    render();
  }

  function exportCsv() {
    const now = nowMs();
    const days = mondayOfWeek(now);
    const rows = [['trabajador', 'fecha', 'entrada', 'salida', 'duracion_hhmmss']];
    const name = state.worker || 'sin-nombre';
    days.forEach((ymd) => {
      state.punches.filter((p) => ymdInMadrid(p.in) === ymd).forEach((p) => {
        rows.push([
          name,
          ymd,
          fmtTime(p.in),
          p.out ? fmtTime(p.out) : '',
          p.out ? elapsedLabel(p.in, p.out) : ''
        ]);
      });
    });
    if (state.openIn) {
      rows.push([name, ymdInMadrid(state.openIn), fmtTime(state.openIn), '', '(abierto)']);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `registro-jornada-${days[0]}-${days[6]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearWeekConfirm() {
    if (!confirm('¿Borrar todos los fichajes guardados en este dispositivo?')) return;
    state.punches = [];
    state.openIn = null;
    save(state);
    render();
  }

  $('#worker-name').addEventListener('change', () => {
    state.worker = ($('#worker-name').value || '').trim();
    save(state);
  });
  $('#btn-in').addEventListener('click', punchIn);
  $('#btn-out').addEventListener('click', punchOut);
  $('#btn-csv').addEventListener('click', exportCsv);
  $('#btn-print').addEventListener('click', () => window.print());
  $('#btn-clear').addEventListener('click', clearWeekConfirm);

  render();
  tickTimer = setInterval(render, 1000);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
