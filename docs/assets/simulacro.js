// Simulacro de entrevista: elige preguntas al azar de todas las temáticas (las inyecta el hook hooks/entrevistas.py
// como JSON en la página), con cronómetro, respuesta modelo, autoevaluación, resumen por temática e historial.
// Si el asistente local (chat/server.py) está encendido, puede evaluar la respuesta como un entrevistador.
(function () {
  const API = window.STUDYHUB_CHAT_URL || "http://127.0.0.1:8001";
  const SESSION_KEY = "studyhub-simulacro";               // sessionStorage: el simulacro en curso
  const HISTORY_KEY = "studyhub-simulacro-historial";     // localStorage: resultados anteriores
  const CONFIG_KEY = "studyhub-simulacro-config";         // localStorage: última configuración
  const OPT_IN_KEY = "studyhub-asistente";                // el mismo interruptor que el chat (ver chat.js)
  const MAX_HISTORY = 20;
  const LEVEL_CLASS = { "Básico": "basico", "Medio": "medio", "Avanzado": "avanzado" };
  const PRESETS = [
    { id: "rapida", label: "Ronda rápida", hint: "8 preguntas · 2 min", n: 8, minutes: 2, levels: ["Básico", "Medio"] },
    { id: "tecnica", label: "Entrevista técnica", hint: "12 preguntas · 3 min", n: 12, minutes: 3, levels: ["Medio", "Avanzado"] },
    { id: "loop", label: "Loop de arquitecto", hint: "20 preguntas · 4 min", n: 20, minutes: 4, levels: ["Básico", "Medio", "Avanzado"] },
  ];
  const SCORES = [
    { value: 2, label: "✓ La clavé", cls: "bien" },
    { value: 1, label: "≈ A medias", cls: "medias" },
    { value: 0, label: "✗ No la sabía", cls: "mal" },
  ];
  const AI_PROMPT =
    "Actúa como entrevistador técnico en una entrevista para un puesto de arquitecto de software. Evalúa mi " +
    "respuesta a la pregunta del contexto. Usa la respuesta modelo solo como referencia: puede haber respuestas " +
    "buenas distintas. Responde, breve y directo, con: 1) qué he cubierto bien, 2) qué falta o es impreciso, " +
    "3) una nota de 0 a 10 y 4) la repregunta que me harías a continuación.\n\nMi respuesta:\n";

  let data = null;            // {topics: {clave: nombre}, levels: [...], questions: [...]}
  let byId = new Map();
  let root = null;
  let state = null;           // simulacro en curso (se guarda en sessionStorage)
  let timer = null;
  let aiAvailable = false;
  let aiController = null;

  // --- utilidades ----------------------------------------------------------------------------------------------
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "text") node.textContent = v;
      else if (k === "onclick") node.addEventListener("click", v);
      else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
    });
    children.forEach((c) => c && node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }
  function renderMarkdown(target, text) {
    if (window.marked && window.DOMPurify) {
      target.innerHTML = window.DOMPurify.sanitize(window.marked.parse(text));
    } else {
      target.textContent = text;       // sin librerías: texto plano, nunca HTML sin sanear
    }
  }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function fmt(seconds) {
    const s = Math.max(0, Math.round(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  function pct(points, count) { return count ? Math.round((points / (2 * count)) * 100) : 0; }
  function levelBadge(level) { return el("span", { class: `nivel ${LEVEL_CLASS[level] || ""}`, text: level }); }
  function table(headers, rows) {      // con scroll horizontal propio, como las tablas de Markdown en Material
    return el("div", { class: "sim-tabla" }, [el("table", {}, [
      el("thead", {}, [el("tr", {}, headers.map((t) => el("th", { text: t })))]),
      el("tbody", {}, rows),
    ])]);
  }

  // --- almacenamiento (puede no estar disponible: el simulacro funciona igual, solo sin memoria) ---------------
  function read(storage, key, fallback) {
    try { return JSON.parse(window[storage].getItem(key)) ?? fallback; } catch (e) { return fallback; }
  }
  function write(storage, key, value) {
    try {
      if (value === null) window[storage].removeItem(key);
      else window[storage].setItem(key, JSON.stringify(value));
    } catch (e) { /* sin almacenamiento */ }
  }
  const saveState = () => write("sessionStorage", SESSION_KEY, state);

  // --- elegir preguntas ----------------------------------------------------------------------------------------
  function poolFor(config) {
    return data.questions.filter((q) => config.topics.includes(q.topic) && config.levels.includes(q.level));
  }

  // Reparto equilibrado: una de cada temática por turnos (en orden aleatorio), de menos a más difícil, y las
  // conductuales al final, como la ronda de cierre de una entrevista real.
  function pick(config) {
    const groups = new Map();
    shuffle(poolFor(config)).forEach((q) => {
      if (!groups.has(q.topic)) groups.set(q.topic, []);
      groups.get(q.topic).push(q);
    });
    const order = shuffle([...groups.keys()]);
    const picked = [];
    while (picked.length < config.n && order.some((t) => groups.get(t).length)) {
      for (const t of order) {
        if (picked.length < config.n && groups.get(t).length) picked.push(groups.get(t).pop());
      }
    }
    const rank = (q) => (q.topic === "conductuales" ? 10 : 0) + data.levels.indexOf(q.level);
    return picked
      .map((q, i) => ({ q, i }))
      .sort((a, b) => rank(a.q) - rank(b.q) || a.i - b.i)
      .map(({ q }) => q.id);
  }

  function start(config, ids) {
    write("localStorage", CONFIG_KEY, config);
    state = {
      config, ids, idx: 0, scores: {}, notes: {}, times: {},
      revealed: false, finished: false, startedAt: Date.now(), qStartedAt: Date.now(),
    };
    saveState();
    renderQuestion();
  }

  // --- pantalla 1: configuración ------------------------------------------------------------------------------
  function renderSetup() {
    stopTimer();
    const last = read("localStorage", CONFIG_KEY, null);
    const config = {
      topics: Object.keys(data.topics),
      levels: ["Medio", "Avanzado"],
      n: 12,
      minutes: 3,
      ...(last || {}),
    };
    config.topics = config.topics.filter((t) => data.topics[t]);

    const topicBoxes = Object.entries(data.topics).map(([key, name]) => {
      const count = data.questions.filter((q) => q.topic === key).length;
      const box = el("input", { type: "checkbox", value: key, checked: config.topics.includes(key) });
      return el("label", { class: "sim-check" }, [box, ` ${name} `, el("small", { text: `(${count})` })]);
    });
    const levelBoxes = data.levels.map((lvl) => {
      const box = el("input", { type: "checkbox", value: lvl, checked: config.levels.includes(lvl) });
      return el("label", { class: "sim-check" }, [box, " ", levelBadge(lvl)]);
    });
    const nInput = el("input", { type: "number", min: "1", max: "60", value: String(config.n), class: "sim-input" });
    const timeSelect = el("select", { class: "sim-input" }, [
      ["0", "Sin límite"], ["2", "2 min"], ["3", "3 min"], ["4", "4 min"], ["5", "5 min"],
    ].map(([v, t]) => el("option", { value: v, text: t, selected: String(config.minutes) === v })));
    const available = el("p", { class: "sim-disponibles" });
    const startBtn = el("button", { type: "button", class: "md-button md-button--primary", text: "Empezar el simulacro" });

    const current = () => ({
      topics: topicBoxes.map((l) => l.firstChild).filter((b) => b.checked).map((b) => b.value),
      levels: levelBoxes.map((l) => l.firstChild).filter((b) => b.checked).map((b) => b.value),
      n: Math.max(1, Math.min(60, parseInt(nInput.value, 10) || 1)),
      minutes: parseInt(timeSelect.value, 10) || 0,
    });
    const update = () => {
      const c = current();
      const total = poolFor(c).length;
      available.textContent = total
        ? `Hay ${total} preguntas con esta selección; el simulacro tendrá ${Math.min(c.n, total)}.`
        : "No hay preguntas con esta selección: marca al menos una temática y un nivel.";
      startBtn.disabled = !total;
    };

    const presetBtns = PRESETS.map((p) => el("button", {
      type: "button", class: "sim-preset",
      onclick: () => {
        nInput.value = String(p.n);
        timeSelect.value = String(p.minutes);
        levelBoxes.forEach((l) => { l.firstChild.checked = p.levels.includes(l.firstChild.value); });
        topicBoxes.forEach((l) => { l.firstChild.checked = true; });
        update();
      },
    }, [el("strong", { text: p.label }), el("small", { text: p.hint })]));

    const allBtn = el("button", { type: "button", class: "sim-link", text: "todas", onclick: () => { topicBoxes.forEach((l) => { l.firstChild.checked = true; }); update(); } });
    const noneBtn = el("button", { type: "button", class: "sim-link", text: "ninguna", onclick: () => { topicBoxes.forEach((l) => { l.firstChild.checked = false; }); update(); } });

    startBtn.addEventListener("click", () => {
      const c = current();
      const ids = pick(c);
      if (ids.length) start(c, ids);
    });

    const form = el("div", { class: "sim-panel" }, [
      el("div", { class: "sim-presets" }, presetBtns),
      el("fieldset", { class: "sim-fieldset" }, [
        el("legend", {}, ["Temáticas · ", allBtn, " / ", noneBtn]),
        el("div", { class: "sim-checks" }, topicBoxes),
      ]),
      el("fieldset", { class: "sim-fieldset" }, [el("legend", { text: "Niveles" }), el("div", { class: "sim-checks" }, levelBoxes)]),
      el("div", { class: "sim-row" }, [
        el("label", { class: "sim-field" }, ["Preguntas ", nInput]),
        el("label", { class: "sim-field" }, ["Tiempo por pregunta ", timeSelect]),
      ]),
      available,
      startBtn,
    ]);
    form.addEventListener("change", update);
    form.addEventListener("input", update);
    update();

    root.replaceChildren(form, renderHistory());
  }

  function renderHistory() {
    const history = read("localStorage", HISTORY_KEY, []);
    if (!history.length) return document.createDocumentFragment();
    const rows = history.slice(0, 8).map((h) => {
      const weakest = Object.entries(h.topics || {}).sort((a, b) => a[1] - b[1])[0];
      return el("tr", {}, [
        el("td", { text: new Date(h.date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) }),
        el("td", { text: String(h.n) }),
        el("td", { text: `${h.pct} %` }),
        el("td", { text: weakest ? `${data.topics[weakest[0]] || weakest[0]} (${weakest[1]} %)` : "—" }),
      ]);
    });
    const clearBtn = el("button", {
      type: "button", class: "sim-link", text: "Borrar historial",
      onclick: () => { write("localStorage", HISTORY_KEY, null); renderSetup(); },
    });
    return el("div", { class: "sim-historial" }, [
      el("h2", { text: "Tus últimos simulacros" }),
      table(["Fecha", "Preguntas", "Nota", "Temática más floja"], rows),
      el("p", {}, [el("small", { text: "Guardado solo en este navegador. " }), clearBtn]),
    ]);
  }

  // --- pantalla 2: una pregunta ---------------------------------------------------------------------------------
  function renderQuestion() {
    stopTimer();
    abortAI();
    const q = byId.get(state.ids[state.idx]);
    const total = state.ids.length;

    const clock = el("span", { class: "sim-reloj", "aria-live": "off" });
    const progress = el("div", { class: "sim-progreso" }, [el("span", { style: `width:${(state.idx / total) * 100}%` })]);
    const header = el("div", { class: "sim-cabecera" }, [
      el("span", { text: `Pregunta ${state.idx + 1} de ${total}` }),
      clock,
    ]);
    const meta = el("div", { class: "sim-meta" }, [
      el("span", { class: "sim-chip", text: data.topics[q.topic] }),
      q.subtopic ? el("span", { class: "sim-chip sim-chip--suave", text: q.subtopic }) : null,
      levelBadge(q.level),
    ]);

    const notes = el("textarea", {
      class: "sim-notas", rows: "5",
      placeholder: "Tu respuesta o tus notas (opcional; necesaria para el feedback de la IA). Mejor aún: respóndela en voz alta.",
    });
    notes.value = state.notes[q.id] || "";
    notes.addEventListener("input", () => { state.notes[q.id] = notes.value; saveState(); });

    const answer = el("div", { class: "sim-respuesta", hidden: !state.revealed });
    const answerBody = el("div", { class: "sim-respuesta-texto" });
    renderMarkdown(answerBody, q.a);
    const scoreBtns = SCORES.map((s) => el("button", {
      type: "button", class: `sim-nota sim-nota--${s.cls}`, text: s.label, onclick: () => score(q, s.value),
    }));
    answer.append(
      el("div", { class: "sim-respuesta-titulo" }, [
        el("strong", { text: "Respuesta modelo" }),
        el("a", { href: q.url, target: "_blank", rel: "noopener", text: "ver en su página ↗" }),
      ]),
      answerBody,
      el("p", { class: "sim-pregunta-autoeval", text: "¿Cómo te ha ido?" }),
      el("div", { class: "sim-acciones" }, scoreBtns),
    );

    const aiBox = el("div", { class: "sim-ia", hidden: true });
    const revealBtn = el("button", {
      type: "button", class: "md-button md-button--primary", text: "Ver respuesta modelo", hidden: state.revealed,
      onclick: () => {
        state.revealed = true; saveState();
        answer.hidden = false; revealBtn.hidden = true;
        answer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      },
    });
    const aiBtn = el("button", {
      type: "button", class: "md-button sim-ia-btn", text: "Pedir feedback a la IA", hidden: !aiAvailable,
      onclick: () => askAI(q, notes.value, aiBox, aiBtn),
    });
    const skipBtn = el("button", { type: "button", class: "md-button", text: "Saltar", onclick: () => score(q, null) });
    const endBtn = el("button", { type: "button", class: "sim-link", text: "Terminar ahora", onclick: finishEarly });

    root.replaceChildren(el("div", { class: "sim-panel" }, [
      header, progress, meta,
      el("p", { class: "sim-pregunta", text: q.q }),
      notes,
      el("div", { class: "sim-acciones" }, [revealBtn, aiBtn, skipBtn]),
      aiBox,
      answer,
      el("p", { class: "sim-pie" }, [endBtn]),
    ]));

    const limit = (state.config.minutes || 0) * 60;
    const tick = () => {
      const elapsed = (Date.now() - state.qStartedAt) / 1000;
      if (!limit) {
        clock.textContent = `⏱ ${fmt(elapsed)}`;
      } else if (elapsed <= limit) {
        clock.textContent = `⏱ ${fmt(limit - elapsed)}`;
        clock.classList.toggle("sim-reloj--aviso", limit - elapsed <= 30);
      } else {
        clock.textContent = `⏱ +${fmt(elapsed - limit)} fuera de tiempo`;
        clock.classList.add("sim-reloj--fuera");
      }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  function score(q, value) {
    state.times[q.id] = Math.round((Date.now() - state.qStartedAt) / 1000);
    state.scores[q.id] = value;              // null = saltada
    state.idx += 1;
    state.revealed = false;
    state.qStartedAt = Date.now();
    if (state.idx >= state.ids.length) return finish();
    saveState();
    renderQuestion();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finishEarly() {
    if (state.idx === 0) { state = null; saveState(); renderSetup(); return; }
    state.ids = state.ids.slice(0, state.idx);
    finish();
  }

  function finish() {
    stopTimer();
    abortAI();
    if (!state.finished) {
      state.finished = true;
      const s = summarize();
      const history = read("localStorage", HISTORY_KEY, []);
      history.unshift({ date: new Date().toISOString(), n: state.ids.length, pct: s.pct, topics: s.topicPct });
      write("localStorage", HISTORY_KEY, history.slice(0, MAX_HISTORY));
    }
    saveState();
    renderSummary();
  }

  // --- pantalla 3: resumen ------------------------------------------------------------------------------------
  function summarize() {
    const topics = new Map();
    let points = 0;
    state.ids.forEach((id) => {
      const q = byId.get(id);
      const v = state.scores[id] ?? 0;               // saltada cuenta como no sabida
      points += v;
      const t = topics.get(q.topic) || { points: 0, count: 0 };
      t.points += v; t.count += 1;
      topics.set(q.topic, t);
    });
    const topicPct = {};
    topics.forEach((t, key) => { topicPct[key] = pct(t.points, t.count); });
    return { pct: pct(points, state.ids.length), topics, topicPct };
  }

  function renderSummary() {
    const s = summarize();
    const seconds = state.ids.reduce((acc, id) => acc + (state.times[id] || 0), 0);
    const verdict = s.pct >= 80 ? "Muy bien: estás listo para estas temáticas." :
      s.pct >= 60 ? "Bien, con huecos concretos que repasar." :
      s.pct >= 40 ? "A medio camino: repasa las temáticas más flojas antes de la próxima." :
      "Toca repasar la teoría de estas temáticas y volver a intentarlo.";

    const topicRows = [...s.topics.entries()]
      .sort((a, b) => s.topicPct[a[0]] - s.topicPct[b[0]])
      .map(([key, t]) => el("tr", {}, [
        el("td", { text: data.topics[key] }),
        el("td", { text: String(t.count) }),
        el("td", {}, [el("div", { class: "sim-barra" }, [el("span", { style: `width:${s.topicPct[key]}%` })]), ` ${s.topicPct[key]} %`]),
      ]));

    const RESULT = { 2: ["✓", "bien"], 1: ["≈", "medias"], 0: ["✗", "mal"], null: ["–", "saltada"] };
    const items = state.ids.map((id) => {
      const q = byId.get(id);
      const [icon, cls] = RESULT[state.scores[id] ?? "null"];
      return el("li", { class: `sim-resultado sim-resultado--${cls}` }, [
        el("span", { class: "sim-resultado-icono", text: icon }),
        el("a", { href: q.url, text: q.q }),
        " ", levelBadge(q.level),
      ]);
    });
    const failed = state.ids.filter((id) => (state.scores[id] ?? 0) < 2);

    const retryBtn = el("button", {
      type: "button", class: "md-button md-button--primary", text: `Repetir las ${failed.length} que no clavé`,
      hidden: !failed.length,
      onclick: () => start({ ...state.config, n: failed.length }, shuffle(failed)),
    });
    const newBtn = el("button", {
      type: "button", class: "md-button", text: "Nuevo simulacro",
      onclick: () => { state = null; saveState(); renderSetup(); },
    });

    root.replaceChildren(el("div", { class: "sim-panel" }, [
      el("div", { class: "sim-nota-final" }, [
        el("strong", { text: `${s.pct} %` }),
        el("span", { text: `${state.ids.length} preguntas · ${fmt(seconds)} min` }),
      ]),
      el("p", { text: verdict }),
      el("h2", { text: "Por temática" }),
      table(["Temática", "Preguntas", "Nota"], topicRows),
      el("h2", { text: "Pregunta a pregunta" }),
      el("p", {}, [el("small", { text: "Pulsa una pregunta para repasarla en su página, con la teoría enlazada." })]),
      el("ul", { class: "sim-resultados" }, items),
      el("div", { class: "sim-acciones" }, [retryBtn, newBtn]),
    ]), renderHistory());
  }

  // --- feedback con IA (servidor local del asistente) ---------------------------------------------------------
  function assistantAllowed() {
    if (["localhost", "127.0.0.1"].includes(location.hostname)) return true;
    try { return localStorage.getItem(OPT_IN_KEY) === "1"; } catch (e) { return false; }
  }

  function checkAI() {
    if (!assistantAllowed()) return;
    fetch(`${API}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        aiAvailable = Boolean(info && info.ok && info.configured);
        document.querySelectorAll(".sim-ia-btn").forEach((b) => { b.hidden = !aiAvailable; });
      })
      .catch(() => { aiAvailable = false; });
  }

  function abortAI() {
    if (aiController) aiController.abort();
    aiController = null;
  }

  async function askAI(q, answer, box, button) {
    box.hidden = false;
    box.replaceChildren();
    if (!answer.trim()) {
      box.append(el("p", { class: "sim-aviso", text: "Escribe tu respuesta en el cuadro para que la IA pueda evaluarla." }));
      return;
    }
    abortAI();
    aiController = new AbortController();
    const controller = aiController;
    button.disabled = true;
    const title = el("strong", { text: "Feedback del entrevistador (IA)" });
    const body = el("div", { class: "sim-ia-texto sim-escribiendo" });
    box.append(title, body);
    let text = "";
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_title: "Simulacro de entrevista",
          page_url: location.pathname,
          page_text: `Pregunta de entrevista (${data.topics[q.topic]} · ${q.level}): ${q.q}\n\n` +
                     `Respuesta modelo de referencia:\n${q.a}`,
          messages: [{ role: "user", content: AI_PROMPT + answer.slice(0, 6000) }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop();                            // el último puede estar incompleto
        for (const evt of events) {
          if (!evt.startsWith("data: ")) continue;
          const msg = JSON.parse(evt.slice(6));
          if (msg.type === "text") {
            text += msg.text;
            body.classList.remove("sim-escribiendo");
            renderMarkdown(body, text);
          } else if (msg.type === "error") {
            box.append(el("p", { class: "sim-aviso", text: msg.message }));
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        box.append(el("p", { class: "sim-aviso", text: e.message.includes("fetch") ?
          "No se puede conectar con el asistente. ¿Está arrancado (./serve.ps1)?" : e.message }));
      }
    } finally {
      body.classList.remove("sim-escribiendo");
      if (!text) body.remove();
      button.disabled = false;
      if (aiController === controller) aiController = null;
    }
  }

  // --- arranque (compatible con la navegación instantánea de Material) -----------------------------------------
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function init() {
    stopTimer();
    abortAI();
    root = document.getElementById("simulacro");
    const source = document.getElementById("sim-datos");
    if (!root || !source) return;
    try {
      data = JSON.parse(source.textContent);
    } catch (e) {
      root.textContent = "No se han podido cargar las preguntas del simulacro.";
      return;
    }
    byId = new Map(data.questions.map((q) => [q.id, q]));
    checkAI();

    state = read("sessionStorage", SESSION_KEY, null);
    if (state && Array.isArray(state.ids)) {
      state.ids = state.ids.filter((id) => byId.has(id));   // las preguntas pueden haber cambiado entre builds
      if (state.idx > state.ids.length) state.idx = state.ids.length;
    }
    if (!state || !state.ids || !state.ids.length) {
      state = null;
      saveState();
      renderSetup();
    } else if (state.finished || state.idx >= state.ids.length) {
      finish();
    } else {
      renderQuestion();
    }
  }

  if (typeof document$ !== "undefined") document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
