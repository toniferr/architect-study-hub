// Asistente de estudio: burbuja de chat que envía preguntas (con el contenido de la página actual como contexto)
// al servidor local chat/server.py, que llama a la API de Claude. La clave de API nunca está en el navegador.
(function () {
  const API = window.STUDYHUB_CHAT_URL || "http://127.0.0.1:8001";
  const STORE_KEY = "studyhub-chat";
  let messages = load();              // [{role: "user"|"assistant", content: string}]
  let controller = null;              // AbortController de la respuesta en curso
  let lastSelection = "";
  let healthChecked = false;

  // --- persistencia por pestaña (sessionStorage puede no estar disponible) -------------------------------------
  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages)); } catch (e) { /* sin almacenamiento: solo en memoria */ }
  }

  // --- utilidades ----------------------------------------------------------------------------------------------
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => (k === "text" ? (node.textContent = v) : node.setAttribute(k, v)));
    children.forEach((c) => node.appendChild(c));
    return node;
  }
  function renderMarkdown(target, text) {
    if (window.marked && window.DOMPurify) {
      target.innerHTML = window.DOMPurify.sanitize(window.marked.parse(text));
    } else {
      target.textContent = text;       // sin librerías: texto plano, nunca HTML sin sanear
    }
  }
  function pageContext() {
    const article = document.querySelector("article.md-content__inner");
    const title = (document.querySelector("article h1")?.textContent || document.title).trim();
    const text = (article?.textContent || "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
    return { page_title: title, page_url: location.pathname, page_text: text };
  }

  // --- interfaz ------------------------------------------------------------------------------------------------
  const ICON_CHAT = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.2 1.1 4.2 2.9 5.6L4 21l4.6-2.3c1.1.3 2.2.4 3.4.4 5.5 0 10-3.6 10-8S17.5 3 12 3m-4 9.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4m4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4m4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4"/></svg>';

  function build() {
    const bubble = el("button", { class: "shc-bubble", type: "button", "aria-label": "Abrir el asistente de estudio", title: "Preguntar a la IA" });
    bubble.innerHTML = ICON_CHAT;

    const context = el("div", { class: "shc-context" });
    const clearBtn = el("button", { class: "shc-icon-btn", type: "button", title: "Nueva conversación", text: "↺" });
    const closeBtn = el("button", { class: "shc-icon-btn", type: "button", title: "Cerrar", text: "✕" });
    const header = el("div", { class: "shc-header" }, [
      el("div", {}, [el("div", { class: "shc-title", text: "Asistente de estudio" }), context]),
      el("div", { class: "shc-actions" }, [clearBtn, closeBtn]),
    ]);
    const list = el("div", { class: "shc-messages", "aria-live": "polite" });
    const selectionChip = el("button", { class: "shc-chip", type: "button", hidden: "" });
    const input = el("textarea", { class: "shc-input", rows: "2", placeholder: "Pregunta sobre esta página… (Enter envía, Mayús+Enter salto de línea)" });
    const sendBtn = el("button", { class: "shc-send", type: "button", text: "Enviar" });
    const footer = el("div", { class: "shc-footer" }, [selectionChip, el("div", { class: "shc-row" }, [input, sendBtn])]);
    const panel = el("section", { class: "shc-panel", role: "dialog", "aria-label": "Asistente de estudio", hidden: "" }, [header, list, footer]);

    document.body.append(bubble, panel);
    return { bubble, panel, list, input, sendBtn, clearBtn, closeBtn, context, selectionChip };
  }

  let ui = null;

  function addMessage(role, content) {
    const bubble = el("div", { class: `shc-msg shc-${role}` });
    if (role === "assistant") renderMarkdown(bubble, content); else bubble.textContent = content;
    ui.list.appendChild(bubble);
    ui.list.scrollTop = ui.list.scrollHeight;
    return bubble;
  }
  function addNotice(text, kind = "info") {
    ui.list.appendChild(el("div", { class: `shc-notice shc-${kind}`, text }));
    ui.list.scrollTop = ui.list.scrollHeight;
  }
  function redraw() {
    ui.list.innerHTML = "";
    if (!messages.length) {
      addNotice("Pregunta cualquier duda sobre lo que estás estudiando. El asistente ve el contenido de la página actual. " +
                "Consejo: selecciona un fragmento de texto antes de abrir el chat para preguntar por él.");
    }
    messages.forEach((m) => addMessage(m.role, m.content));
  }
  function setBusy(busy) {
    ui.sendBtn.textContent = busy ? "Detener" : "Enviar";
    ui.input.disabled = busy;
  }

  async function checkHealth() {
    if (healthChecked) return;
    try {
      const res = await fetch(`${API}/health`);
      const info = await res.json();
      healthChecked = true;
      if (!info.configured) addNotice(`El servidor del asistente está en marcha pero falta la clave: añade ${info.key_var} al fichero .env y reinícialo.`, "error");
    } catch (e) {
      addNotice("No se puede conectar con el asistente. Arráncalo con ./serve.ps1 (o python chat/server.py) y vuelve a intentarlo.", "error");
    }
  }

  async function send() {
    if (controller) { controller.abort(); return; }      // el botón hace de "Detener"
    const question = ui.input.value.trim();
    if (!question) return;
    ui.input.value = "";
    ui.selectionChip.hidden = true;
    messages.push({ role: "user", content: question });
    save();
    if (messages.length === 1) ui.list.innerHTML = "";
    addMessage("user", question);

    const answerEl = addMessage("assistant", "");
    answerEl.classList.add("shc-typing");
    let answer = "";
    controller = new AbortController();
    setBusy(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pageContext(), messages }),
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
          const data = JSON.parse(evt.slice(6));
          if (data.type === "text") {
            answer += data.text;
            answerEl.classList.remove("shc-typing");
            renderMarkdown(answerEl, answer);
            ui.list.scrollTop = ui.list.scrollHeight;
          } else if (data.type === "error") {
            addNotice(data.message, "error");
          } else if (data.type === "notice") {
            addNotice(data.message);
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") addNotice(e.message.includes("fetch") ?
        "No se puede conectar con el asistente. ¿Está arrancado (./serve.ps1)?" : e.message, "error");
    } finally {
      answerEl.classList.remove("shc-typing");
      if (answer) {
        messages.push({ role: "assistant", content: answer });
      } else {
        answerEl.remove();
        messages.pop();                                    // sin respuesta: se descarta la pregunta del historial
        ui.input.value = question;                         // y se devuelve al cuadro para reintentar
      }
      save();
      controller = null;
      setBusy(false);
      ui.input.focus();
    }
  }

  function open() {
    ui.panel.hidden = false;
    ui.bubble.classList.add("shc-hidden");
    ui.context.textContent = `Contexto: ${pageContext().page_title}`;
    if (lastSelection) {
      ui.selectionChip.textContent = `Preguntar por la selección: «${lastSelection.slice(0, 60)}${lastSelection.length > 60 ? "…" : ""}»`;
      ui.selectionChip.hidden = false;
    }
    checkHealth();
    ui.input.focus();
  }
  function close() {
    ui.panel.hidden = true;
    ui.bubble.classList.remove("shc-hidden");
  }

  // --- activación ---------------------------------------------------------------------------------------------
  // En local (127.0.0.1 / localhost) el asistente está siempre activo. En la versión publicada (github.io) solo se
  // activa en los navegadores donde el dueño lo ha pedido con ?asistente=1 (se desactiva con ?asistente=0), y solo
  // aparece si su servidor local responde. Así los visitantes nunca intentan conectar con su red local.
  const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
  const OPT_IN_KEY = "studyhub-asistente";
  let probing = false;

  function isLocalSite() { return LOCAL_HOSTS.includes(location.hostname); }

  function optedIn() {
    const flag = new URLSearchParams(location.search).get("asistente");
    try {
      if (flag === "1") localStorage.setItem(OPT_IN_KEY, "1");
      if (flag === "0") localStorage.removeItem(OPT_IN_KEY);
      return localStorage.getItem(OPT_IN_KEY) === "1";
    } catch (e) {
      return flag === "1";
    }
  }

  function init() {
    if (ui) {                                              // navegación instantánea: solo actualizar el contexto
      ui.context.textContent = `Contexto: ${pageContext().page_title}`;
      return;
    }
    if (isLocalSite()) { create(); return; }
    if (!optedIn() || probing) return;
    probing = true;
    fetch(`${API}/health`)                                 // solo se muestra si el servidor local está encendido
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => { if (info && info.ok && !ui) { healthChecked = false; create(); } })
      .catch(() => { /* servidor apagado: no se muestra nada */ })
      .finally(() => { probing = false; });
  }

  function create() {
    if (ui) {                                              // navegación instantánea: solo actualizar el contexto
      ui.context.textContent = `Contexto: ${pageContext().page_title}`;
      return;
    }
    ui = build();
    redraw();
    ui.bubble.addEventListener("click", open);
    ui.closeBtn.addEventListener("click", close);
    ui.clearBtn.addEventListener("click", () => { if (controller) controller.abort(); messages = []; save(); redraw(); });
    ui.sendBtn.addEventListener("click", send);
    ui.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
      if (e.key === "Escape") close();
    });
    ui.selectionChip.addEventListener("click", () => {
      ui.input.value = `Explícame este fragmento:\n«${lastSelection}»\n\n`;
      ui.selectionChip.hidden = true;
      ui.input.focus();
    });
    document.addEventListener("mouseup", (e) => {
      if (ui.panel.contains(e.target) || ui.bubble.contains(e.target)) return;
      const text = (window.getSelection()?.toString() || "").trim();
      lastSelection = text.length > 3 ? text.slice(0, 2000) : "";
    });
  }

  if (typeof document$ !== "undefined") document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
