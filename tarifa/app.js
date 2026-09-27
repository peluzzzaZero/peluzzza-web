/**
 * Brújula — calculadora-tarifa-freelance
 * Math (estimación orientativa, no asesoramiento fiscal):
 *   coste_mensual = gastos_fijos + reta + gestoria
 *   horas_facturables = horas_mes * (pct_facturables/100)
 *   coste_hora = coste_mensual / max(horas_facturables, 1)
 *   tarifa_hora_min = coste_hora / (1 - irpf/100)   // gross-up reserva IRPF
 *   tarifa_hora_margen = tarifa_hora_min * (1 + margen/100)
 *   tarifa_dia = tarifa_hora_margen * (horas_facturables / max(dias_facturables, 1))
 *   ingreso_objetivo = tarifa_hora_margen * horas_facturables
 */
(() => {
  const STORAGE_KEY = "brujula-tarifa-freelance";
  const DEFAULTS = {
    gastos: 200,
    reta: 294,
    gestoria: 60,
    irpf: 20,
    margen: 30,
    horas: 160,
    pct_fact: 70,
    dias: 20
  };

  const $ = (id) => document.getElementById(id);
  const fields = ["gastos", "reta", "gestoria", "irpf", "margen", "horas", "pct_fact", "dias"];

  function euro(n) {
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2
    }).format(n);
  }

  function num(id) {
    const v = parseFloat($(id).value);
    return Number.isFinite(v) ? v : 0;
  }

  function readInputs() {
    const o = {};
    for (const f of fields) o[f] = num(f);
    return o;
  }

  function writeInputs(data) {
    for (const f of fields) {
      if (data[f] != null) $(f).value = data[f];
    }
  }

  function calc(input) {
    const coste_mensual = input.gastos + input.reta + input.gestoria;
    const horas_facturables = Math.max(input.horas * (input.pct_fact / 100), 0);
    const denomH = Math.max(horas_facturables, 1);
    const coste_hora = coste_mensual / denomH;
    const irpfFactor = input.irpf >= 100 ? 1 : 1 - input.irpf / 100;
    const tarifa_hora_min = irpfFactor > 0 ? coste_hora / irpfFactor : coste_hora;
    const tarifa_hora_margen = tarifa_hora_min * (1 + input.margen / 100);
    const horas_por_dia = horas_facturables / Math.max(input.dias, 1);
    const tarifa_dia = tarifa_hora_margen * horas_por_dia;
    const ingreso_objetivo = tarifa_hora_margen * horas_facturables;
    const reserva_irpf = ingreso_objetivo * (input.irpf / 100);
    const margen_€ = ingreso_objetivo - coste_mensual - reserva_irpf;
    return {
      coste_mensual,
      horas_facturables,
      tarifa_hora_min,
      tarifa_hora_margen,
      tarifa_dia,
      ingreso_objetivo,
      reserva_irpf,
      margen_€
    };
  }

  function render(result) {
    const box = $("results");
    box.hidden = false;
    $("out-hora-margen").textContent = euro(result.tarifa_hora_margen);
    $("out-hora-min").textContent = euro(result.tarifa_hora_min);
    $("out-dia").textContent = euro(result.tarifa_dia);
    $("out-ingreso").textContent = euro(result.ingreso_objetivo);
    $("out-costes").textContent = euro(result.coste_mensual);
    $("out-hf").textContent = `${result.horas_facturables.toFixed(1)} h`;
    $("out-irpf-€").textContent = euro(result.reserva_irpf);
    $("out-margen-€").textContent = euro(result.margen_€);
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { scenarios: [] };
      const parsed = JSON.parse(raw);
      return { scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : [] };
    } catch {
      return { scenarios: [] };
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function renderScenarios() {
    const list = $("scenario-list");
    const store = loadStore();
    list.innerHTML = "";
    if (!store.scenarios.length) {
      list.innerHTML = '<li class="empty">Aún no hay escenarios guardados.</li>';
      return;
    }
    for (const s of store.scenarios) {
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.innerHTML = `<div class="name"></div><div class="meta"></div>`;
      left.querySelector(".name").textContent = s.name;
      left.querySelector(".meta").textContent = s.savedAt
        ? `Guardado ${new Date(s.savedAt).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`
        : "";
      const actions = document.createElement("div");
      actions.className = "scenario-actions";
      const btnLoad = document.createElement("button");
      btnLoad.type = "button";
      btnLoad.className = "btn btn-ghost";
      btnLoad.textContent = "Cargar";
      btnLoad.addEventListener("click", () => {
        writeInputs(s.inputs);
        render(calc(s.inputs));
        $("scenario-name").value = s.name;
      });
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn btn-ghost";
      btnDel.textContent = "Borrar";
      btnDel.addEventListener("click", () => {
        const next = loadStore();
        next.scenarios = next.scenarios.filter((x) => x.id !== s.id);
        saveStore(next);
        renderScenarios();
      });
      actions.append(btnLoad, btnDel);
      li.append(left, actions);
      list.appendChild(li);
    }
  }

  $("calc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    render(calc(readInputs()));
  });

  $("btn-reset").addEventListener("click", () => {
    writeInputs(DEFAULTS);
    render(calc(DEFAULTS));
  });

  $("btn-save").addEventListener("click", () => {
    const name = ($("scenario-name").value || "").trim();
    if (!name) {
      $("scenario-name").focus();
      return;
    }
    const store = loadStore();
    const inputs = readInputs();
    const existing = store.scenarios.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
    const entry = {
      id: existing >= 0 ? store.scenarios[existing].id : `s_${Date.now()}`,
      name,
      inputs,
      savedAt: new Date().toISOString()
    };
    if (existing >= 0) store.scenarios[existing] = entry;
    else store.scenarios.unshift(entry);
    saveStore(store);
    renderScenarios();
    render(calc(inputs));
  });

  $("btn-clear-all").addEventListener("click", () => {
    if (!confirm("¿Borrar todos los escenarios locales?")) return;
    saveStore({ scenarios: [] });
    renderScenarios();
  });

  // Boot
  writeInputs(DEFAULTS);
  render(calc(DEFAULTS));
  renderScenarios();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
