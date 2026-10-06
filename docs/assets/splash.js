// Portada: un sistema distribuido en perspectiva isométrica que se monta solo y cuenta, escena a escena, los temas de
// la web (peticiones, eventos, caché, escalado, GitOps, fallos y observabilidad). Cada pieza enlaza a su página de
// teoría. Compatible con la navegación instantánea de Material: se inicia en cada página que tenga #ash-splash.
(function () {
  "use strict";

  // Piezas del sistema: posición en la rejilla (x, y), tamaño (w, d, h), tipo, etiqueta y página de teoría.
  var PARTS = [
    { id: "client", x: 0, y: 3.2, w: 1, d: 1, h: 0.7, kind: "client", label: "cliente", link: "fundamentos/redes/" },
    { id: "gateway", x: 2.3, y: 3.2, w: 1, d: 1, h: 1.2, kind: "gateway", label: "API gateway", link: "arquitectura/apis/" },
    { id: "orders", x: 5, y: 0.8, w: 1.1, d: 1.1, h: 1.6, kind: "service", label: "pedidos", link: "arquitectura/estilos/" },
    { id: "payments", x: 5, y: 3.6, w: 1.1, d: 1.1, h: 1.6, kind: "service", label: "pagos", link: "system-design/pagos/" },
    { id: "catalog", x: 5, y: 6.4, w: 1.1, d: 1.1, h: 1.6, kind: "service", label: "catálogo", link: "diseno/patrones-diseno/" },
    { id: "replica", x: 6.6, y: -0.6, w: 1.1, d: 1.1, h: 1.6, kind: "service", label: "pedidos-2", link: "plataforma/kubernetes/", hidden: true },
    { id: "kafka", x: 7.6, y: 3.4, w: 1.5, d: 1.1, h: 1.3, kind: "kafka", label: "Kafka", link: "datos/kafka/" },
    { id: "postgres", x: 9.6, y: 0.9, w: 1.2, d: 1.2, h: 1.4, kind: "db", label: "PostgreSQL", link: "fundamentos/bases-de-datos/" },
    { id: "redis", x: 9.6, y: 6.6, w: 1, d: 1, h: 0.8, kind: "cache", label: "Redis", link: "system-design/fundamentos/" },
    { id: "git", x: 0.6, y: 8.6, w: 1, d: 1, h: 0.8, kind: "git", label: "Git", link: "plataforma/gitops/" },
    { id: "flux", x: 4.6, y: 9.4, w: 0.9, d: 0.9, h: 0.8, kind: "flux", label: "Flux", link: "plataforma/gitops/" },
    { id: "grafana", x: 1.6, y: -0.6, w: 1, d: 1, h: 1.0, kind: "obs", label: "Grafana", link: "plataforma/observabilidad/" },
  ];
  var CLUSTER = { x: 4.2, y: -1.4, w: 7, d: 12, label: "clúster de Kubernetes", link: "plataforma/kubernetes/" };
  var LINKS = [["client", "gateway"], ["gateway", "orders"], ["gateway", "payments"], ["gateway", "catalog"],
    ["orders", "postgres"], ["orders", "kafka"], ["kafka", "payments"], ["kafka", "catalog"], ["catalog", "redis"],
    ["catalog", "postgres"], ["git", "flux"], ["flux", "payments"], ["gateway", "replica"], ["replica", "postgres"]];

  var SCENES = [
    { id: "req", name: "Petición", text: "Una petición: cliente → API gateway → servicio de pedidos → PostgreSQL, y la respuesta de vuelta." },
    { id: "event", name: "Evento", text: "Comunicación asíncrona: pedidos publica «PedidoCreado» en Kafka; pagos y catálogo lo consumen a su ritmo." },
    { id: "cache", name: "Caché", text: "Cache-aside: catálogo lee de Redis; si falla la caché, va a PostgreSQL y la rellena." },
    { id: "scale", name: "Escalado", text: "Escalado horizontal: sube la carga, el HPA añade una réplica de pedidos y el gateway reparte." },
    { id: "gitops", name: "GitOps", text: "GitOps: un commit en Git, Flux lo reconcilia y despliega pagos v2 con un canary." },
    { id: "fail", name: "Fallo", text: "Un fallo: pagos cae, el circuit breaker abre, Kafka retiene los eventos y Kubernetes reinicia el Pod." },
    { id: "obs", name: "Observabilidad", text: "Observabilidad: métricas, logs y trazas de cada servicio llegan a Grafana; los SLO dicen si vamos bien." },
  ];

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function easeOut(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function bounce(x) {
    x = clamp(x, 0, 1);
    var n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  }

  function init() {
    var root = document.getElementById("ash-splash");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    var canvas = root.querySelector(".ash-splash-canvas");
    var copy = root.querySelector(".ash-splash-copy");
    var hud = root.querySelector(".ash-splash-hud");
    var caption = root.querySelector(".ash-caption");
    var scenesEl = root.querySelector(".ash-scenes");
    var nextBtn = root.querySelector("[data-next]");
    var pauseBtn = root.querySelector("[data-pause]");
    var ctx = canvas.getContext("2d");
    var base = root.dataset.base || ".";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var byId = {};
    PARTS.forEach(function (p) { byId[p.id] = p; });

    var W = 0, H = 0, T = 30, ox = 0, oy = 0, fadeTo = 0, dark = false, C = {};
    var time = 0, sceneIndex = 0, sceneT = 0, buildT = reduce ? 99 : 0, paused = false, running = false, visible = true;
    var packets = [], spawnClock = 0, hover = null, version = "v1", failing = 0;

    // ---------------------------------------------------------------- HUD
    var sceneBtns = SCENES.map(function (s, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = (i + 1) + " · " + s.name;
      b.addEventListener("click", function () { goScene(i); });
      li.appendChild(b);
      scenesEl.appendChild(li);
      return b;
    });
    function syncHud() {
      sceneBtns.forEach(function (b, i) { if (i === sceneIndex) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      caption.textContent = SCENES[sceneIndex].text;
    }

    // ---------------------------------------------------------------- colours and projection
    function readColors() {
      dark = document.body.getAttribute("data-md-color-scheme") === "slate";
      // Material's colours are hsla(var(...)) expressions the canvas cannot parse: read them resolved from the page.
      var bg = getComputedStyle(root).backgroundColor;
      var rgb = (bg.match(/\d+(\.\d+)?/g) || [255, 255, 255]).slice(0, 3).join(",");
      C = {
        bg: "rgb(" + rgb + ")",
        bg0: "rgba(" + rgb + ",0)",
        accent: getComputedStyle(root.querySelector(".ash-eyebrow")).color || "#00bfa5",
        grid: dark ? "rgba(255,255,255,0.06)" : "rgba(40,53,147,0.07)",
        label: dark ? "rgba(255,255,255,0.88)" : "rgba(20,24,40,0.88)",
        labelBg: dark ? "rgba(20,22,30,0.82)" : "rgba(255,255,255,0.9)",
      };
    }

    var KIND = {
      client: ["#b0bec5", "#90a4ae", "#78909c"],
      gateway: ["#4db6ac", "#26a69a", "#00897b"],
      service: ["#7986cb", "#5c6bc0", "#3f51b5"],
      kafka: ["#78909c", "#546e7a", "#37474f"],
      db: ["#5c8fc4", "#336791", "#28527a"],
      cache: ["#ef5350", "#d32f2f", "#b71c1c"],
      git: ["#f4795b", "#f05033", "#c43e27"],
      flux: ["#7b8cff", "#5468ff", "#3d4fe0"],
      obs: ["#ffa04d", "#f46800", "#c45300"],
    };

    function iso(gx, gy, gz) { return { x: ox + (gx - gy) * T, y: oy + (gx + gy) * T / 2 - gz * T }; }

    function layout() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(260, r.height);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cr = copy.getBoundingClientRect();
      var overlay = cr.bottom > r.top + 10 && cr.top < r.bottom;
      fadeTo = overlay ? cr.right - r.left + 20 : 0;
      var left = overlay ? cr.right - r.left + 30 : 10;
      var bottom = overlay ? hud.offsetHeight + 20 : 16;
      // Bounds of the scene for T = 1, then fit it into the free area.
      var xs = [], ys = [];
      function add(gx, gy, gz) { xs.push(gx - gy); ys.push((gx + gy) / 2 - gz); }
      add(CLUSTER.x, CLUSTER.y, 0); add(CLUSTER.x + CLUSTER.w, CLUSTER.y, 0); add(CLUSTER.x, CLUSTER.y + CLUSTER.d, 0); add(CLUSTER.x + CLUSTER.w, CLUSTER.y + CLUSTER.d, 0);
      PARTS.forEach(function (p) { add(p.x, p.y, 0); add(p.x + p.w, p.y + p.d, 0); add(p.x, p.y, p.h + 1); add(p.x + p.w, p.y, p.h + 1); });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      T = Math.min((W - left - 24) / (x1 - x0), (H - 30 - bottom) / (y1 - y0));
      ox = left + (W - left - 24 - (x1 - x0) * T) / 2 - x0 * T;
      oy = 30 + (H - 30 - bottom - (y1 - y0) * T) / 2 - y0 * T;
      readColors();
    }

    // ---------------------------------------------------------------- drawing primitives
    function poly(points, fill, stroke) {
      ctx.beginPath();
      points.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }

    function box(gx, gy, w, d, h, cols, z0) {
      z0 = z0 || 0;
      var a = iso(gx, gy + d, z0), b = iso(gx + w, gy + d, z0), c = iso(gx + w, gy, z0);
      var a2 = iso(gx, gy + d, z0 + h), b2 = iso(gx + w, gy + d, z0 + h), c2 = iso(gx + w, gy, z0 + h), e2 = iso(gx, gy, z0 + h);
      ctx.lineWidth = 1;
      var edge = "rgba(0,0,0,0.25)";
      poly([a, b, b2, a2], cols[1], edge);
      poly([b, c, c2, b2], cols[2], edge);
      poly([e2, c2, b2, a2], cols[0], edge);
    }

    function cylinder(gx, gy, w, h, cols, z0) {
      var c = iso(gx + w / 2, gy + w / 2, z0), top = iso(gx + w / 2, gy + w / 2, z0 + h);
      var rx = w * T * 0.72, ry = rx / 2;
      ctx.fillStyle = cols[2];
      ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = cols[1];
      ctx.fillRect(c.x - rx, top.y, rx * 2, c.y - top.y);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = cols[0];
      ctx.beginPath(); ctx.ellipse(top.x, top.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Two rings, like the usual database icon.
      [0.33, 0.66].forEach(function (k) {
        var y = top.y + (c.y - top.y) * k;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.ellipse(c.x, y, rx, ry, 0, 0, Math.PI); ctx.stroke();
      });
    }

    function drawPart(p, k) {
      if (p.hidden && !p.shown) return;
      var drop = reduce ? 0 : (1 - bounce(k)) * 3;
      var alpha = clamp(k * 3, 0, 1);
      if (alpha <= 0) return;
      ctx.globalAlpha = alpha;
      var cols = KIND[p.kind];
      if (p.id === "payments" && failing > 0) cols = Math.floor(time * 8) % 2 ? ["#ef9a9a", "#e57373", "#c62828"] : cols;
      if (p.kind === "db") cylinder(p.x, p.y, p.w, p.h, cols, drop);
      else if (p.kind === "kafka") {
        for (var s = 0; s < 4; s++) box(p.x, p.y, p.w, p.d, p.h / 4 - 0.04, s % 2 ? KIND.kafka : ["#90a4ae", "#607d8b", "#455a64"], drop + s * p.h / 4);
      } else box(p.x, p.y, p.w, p.d, p.h, cols, drop);
      // Little windows on services and a screen on the client.
      if (p.kind === "service" || p.kind === "gateway") {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (var r = 0; r < 3; r++) {
          var q = iso(p.x + p.w * 0.25, p.y + p.d, drop + p.h * (0.25 + r * 0.25));
          ctx.fillRect(q.x + 2, q.y - 2, T * 0.32, T * 0.1);
        }
      }
      // Hit box and label.
      var top = iso(p.x + p.w / 2, p.y + p.d / 2, drop + p.h);
      var corners = [iso(p.x, p.y + p.d, drop), iso(p.x + p.w, p.y, drop), iso(p.x, p.y, drop + p.h), iso(p.x + p.w, p.y + p.d, drop)];
      p.box = { x0: Math.min.apply(null, corners.map(function (c) { return c.x; })), x1: Math.max.apply(null, corners.map(function (c) { return c.x; })),
        y0: top.y - T * 0.6, y1: Math.max.apply(null, corners.map(function (c) { return c.y; })) };
      var text = p.label + (p.id === "payments" ? " " + version : "");
      ctx.font = "600 " + Math.round(clamp(T * 0.38, 10, 13)) + "px Roboto, system-ui, sans-serif";
      var tw = ctx.measureText(text).width + 10;
      var lx = top.x - tw / 2, ly = top.y - T * 0.55 - 9;
      ctx.fillStyle = C.labelBg;
      ctx.strokeStyle = hover === p ? C.accent : "rgba(128,128,128,0.35)";
      ctx.beginPath(); ctx.roundRect(lx, ly, tw, 17, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.label;
      ctx.textBaseline = "middle";
      ctx.fillText(text, lx + 5, ly + 9);
      ctx.textBaseline = "alphabetic";
      if (p.id === "payments" && version === "v2" && sceneT < 3.5 && SCENES[sceneIndex].id === "gitops") {
        ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(top.x, top.y + T * 0.2, T * 1.1 + Math.sin(time * 6) * 3, T * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function anchor(id) {
      var p = byId[id];
      return { x: p.x + p.w / 2, y: p.y + p.d / 2 };
    }

    function drawFloor() {
      // Isometric grid and the cluster outline.
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (var gx = -1; gx <= 12; gx++) { var a = iso(gx, -2, 0), b = iso(gx, 11, 0); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      for (var gy = -2; gy <= 11; gy++) { var c = iso(-1, gy, 0), d = iso(12, gy, 0); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
      var k = easeOut((buildT - 0.4) / 0.8);
      if (k > 0) {
        ctx.globalAlpha = k;
        var q = [iso(CLUSTER.x, CLUSTER.y, 0), iso(CLUSTER.x + CLUSTER.w, CLUSTER.y, 0), iso(CLUSTER.x + CLUSTER.w, CLUSTER.y + CLUSTER.d, 0), iso(CLUSTER.x, CLUSTER.y + CLUSTER.d, 0)];
        ctx.setLineDash([6, 5]);
        poly(q, dark ? "rgba(0,191,165,0.05)" : "rgba(0,150,136,0.05)", C.accent);
        ctx.setLineDash([]);
        var lp = iso(CLUSTER.x + 0.2, CLUSTER.y + CLUSTER.d - 0.2, 0);
        ctx.fillStyle = C.accent;
        ctx.font = "600 11px Roboto, system-ui, sans-serif";
        ctx.fillText("⎈ " + CLUSTER.label, lp.x - 40, lp.y + 16);
        ctx.globalAlpha = 1;
      }
      // Connections on the floor.
      ctx.lineWidth = 1.4;
      LINKS.forEach(function (l) {
        var pa = byId[l[0]], pb = byId[l[1]];
        if ((pa.hidden && !pa.shown) || (pb.hidden && !pb.shown)) return;
        var a = anchor(l[0]), b = anchor(l[1]);
        var A = iso(a.x, a.y, 0.05), B = iso(b.x, b.y, 0.05);
        ctx.strokeStyle = dark ? "rgba(255,255,255,0.16)" : "rgba(40,53,147,0.22)";
        if (l[0] === "gateway" && l[1] === "payments" && failing > 0) ctx.strokeStyle = "#e53935";
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      });
    }

    var PCOL = { req: "#ffd54f", res: "#69f0ae", event: "#ff9100", metric: "#b388ff", commit: "#f05033", miss: "#ff5252" };
    function drawPackets() {
      packets.forEach(function (p) {
        var k = clamp(p.t / p.d, 0, 1);
        var a = anchor(p.from), b = anchor(p.to);
        var x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
        var s = iso(x, y, 0.35 + Math.sin(k * Math.PI) * 0.4);
        ctx.fillStyle = PCOL[p.kind];
        ctx.shadowColor = PCOL[p.kind]; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(s.x, s.y, clamp(T * 0.13, 3, 6), 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (p.tag && k > 0.1 && k < 0.9) {
          ctx.font = "600 10px Roboto, system-ui, sans-serif";
          ctx.fillStyle = PCOL[p.kind];
          ctx.fillText(p.tag, s.x + 8, s.y - 6);
        }
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawFloor();
      // Painter's order: farther parts (smaller x + y) first.
      var order = PARTS.slice().sort(function (a, b) { return (a.x + a.y) - (b.x + b.y); });
      order.forEach(function (p) {
        var i = PARTS.indexOf(p);
        drawPart(p, (buildT - 0.6 - i * 0.18) / 0.7);
      });
      drawPackets();
      if (hover) {
        ctx.font = "600 12px Roboto, system-ui, sans-serif";
        var text = "Teoría: " + hover.label + " →";
        var w = ctx.measureText(text).width + 14, x = clamp((hover.box.x0 + hover.box.x1) / 2 - w / 2, 4, W - w - 4), y = hover.box.y1 + 8;
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.roundRect(x, y, w, 22, 5); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, x + 7, y + 15);
      }
      if (fadeTo) {
        var g = ctx.createLinearGradient(0, 0, fadeTo + 60, 0);
        g.addColorStop(0, C.bg); g.addColorStop(0.8, C.bg); g.addColorStop(1, C.bg0);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = g; ctx.fillRect(0, 0, fadeTo + 60, H);
        ctx.globalAlpha = 1;
      }
    }

    // ---------------------------------------------------------------- scenes
    function send(from, to, kind, d, tag) { packets.push({ from: from, to: to, kind: kind, t: 0, d: d || 0.9, tag: tag }); }
    function chain(steps, gap) {
      steps.forEach(function (s, i) { setTimeout(function () { if (running || reduce) send(s[0], s[1], s[2], s[3], s[4]); }, i * (gap || 650)); });
    }

    function goScene(i) {
      sceneIndex = (i + SCENES.length) % SCENES.length;
      sceneT = 0; spawnClock = 0; packets = [];
      byId.replica.shown = SCENES[sceneIndex].id === "scale" || SCENES[sceneIndex].id === "gitops" || SCENES[sceneIndex].id === "fail" || SCENES[sceneIndex].id === "obs";
      if (SCENES[sceneIndex].id === "req") { version = "v1"; byId.replica.shown = false; }
      failing = 0;
      syncHud();
      if (reduce) { stillPackets(); draw(); }
    }

    // Each scene emits packets on a rhythm; spawnClock counts the time since the last batch.
    function sceneTick(dt) {
      sceneT += dt; spawnClock += dt;
      var id = SCENES[sceneIndex].id;
      if (id === "req" && spawnClock > 2.6) {
        spawnClock = 0;
        chain([["client", "gateway", "req", 0.8, "GET /pedidos"], ["gateway", "orders", "req", 0.8], ["orders", "postgres", "req", 0.8, "SELECT"],
          ["postgres", "orders", "res", 0.8], ["orders", "gateway", "res", 0.8], ["gateway", "client", "res", 0.8, "200 OK"]]);
      } else if (id === "event" && spawnClock > 2.4) {
        spawnClock = 0;
        chain([["orders", "kafka", "event", 1, "PedidoCreado"], ["kafka", "payments", "event", 1], ["kafka", "catalog", "event", 1.3]], 900);
      } else if (id === "cache" && spawnClock > 1.2) {
        spawnClock = 0;
        if (Math.random() < 0.7) chain([["catalog", "redis", "req", 0.6, "hit"], ["redis", "catalog", "res", 0.6]], 600);
        else chain([["catalog", "redis", "miss", 0.6, "miss"], ["catalog", "postgres", "req", 0.9], ["postgres", "catalog", "res", 0.9], ["catalog", "redis", "res", 0.6, "SET"]], 650);
      } else if (id === "scale") {
        if (sceneT > 1.2) byId.replica.shown = true;
        if (spawnClock > 0.35) {
          spawnClock = 0;
          var target = byId.replica.shown && Math.random() < 0.5 ? "replica" : "orders";
          chain([["client", "gateway", "req", 0.6], ["gateway", target, "req", 0.7]], 550);
        }
      } else if (id === "gitops") {
        if (spawnClock > 4.5 || sceneT < dt * 2) {
          spawnClock = 0; version = "v1";
          chain([["git", "flux", "commit", 1.2, "commit a1b2c3"], ["flux", "payments", "commit", 1.2, "apply"]], 1300);
          setTimeout(function () { version = "v2"; }, 2600);
        }
      } else if (id === "fail") {
        if (sceneT > 0.8 && sceneT < 4.2) failing = 1; else failing = 0;
        if (spawnClock > 0.9) {
          spawnClock = 0;
          if (failing) chain([["client", "gateway", "req", 0.6], ["gateway", "payments", "miss", 0.5, "503 · abierto"], ["orders", "kafka", "event", 0.9, "en cola"]], 500);
          else chain([["client", "gateway", "req", 0.6], ["gateway", "payments", "req", 0.7], ["kafka", "payments", "event", 0.9]], 500);
        }
      } else if (id === "obs" && spawnClock > 0.5) {
        spawnClock = 0;
        var src = ["orders", "payments", "catalog", "gateway", "kafka"][Math.floor(Math.random() * 5)];
        packets.push({ from: src, to: "grafana", kind: "metric", t: 0, d: 1.4, tag: Math.random() < 0.25 ? "p99 120 ms" : "" });
      }
      if (sceneT > 9.5) goScene(sceneIndex + 1);
    }

    function stillPackets() {
      packets = [];
      var id = SCENES[sceneIndex].id;
      var sample = {
        req: [["gateway", "orders", "req", "GET /pedidos"], ["orders", "postgres", "req", "SELECT"]],
        event: [["orders", "kafka", "event", "PedidoCreado"], ["kafka", "payments", "event", ""]],
        cache: [["catalog", "redis", "req", "hit"]],
        scale: [["gateway", "orders", "req", ""], ["gateway", "replica", "req", ""]],
        gitops: [["git", "flux", "commit", "commit"], ["flux", "payments", "commit", "apply"]],
        fail: [["gateway", "payments", "miss", "503 · abierto"]],
        obs: [["orders", "grafana", "metric", "p99 120 ms"], ["kafka", "grafana", "metric", ""]],
      }[id];
      sample.forEach(function (s) { packets.push({ from: s[0], to: s[1], kind: s[2], t: 0.5, d: 1, tag: s[3] }); });
      failing = id === "fail" ? 1 : 0;
      version = id === "gitops" ? "v2" : "v1";
    }

    // ---------------------------------------------------------------- loop and input
    var last = 0;
    function frame(now) {
      if (!running) return;
      if (!document.body.contains(canvas)) { running = false; return; }   // navigated away
      var dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      time += dt; buildT += dt;
      if (buildT > 3) sceneTick(dt);
      packets.forEach(function (p) { p.t += dt; });
      packets = packets.filter(function (p) { return p.t < p.d; });
      draw();
      requestAnimationFrame(frame);
    }
    function setRunning(on) {
      on = on && !paused && visible && !reduce;
      if (on === running) return;
      running = on; last = 0;
      if (on) requestAnimationFrame(frame);
    }

    function hit(x, y) {
      for (var i = PARTS.length - 1; i >= 0; i--) {
        var p = PARTS[i];
        if (p.box && (!p.hidden || p.shown) && x >= p.box.x0 && x <= p.box.x1 && y >= p.box.y0 && y <= p.box.y1) return p;
      }
      return null;
    }
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      hover = hit(e.clientX - r.left, e.clientY - r.top);
      canvas.style.cursor = hover ? "pointer" : "default";
      if (!running) draw();
    });
    canvas.addEventListener("pointerleave", function () { hover = null; if (!running) draw(); });
    canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect();
      var p = hit(e.clientX - r.left, e.clientY - r.top);
      if (p) window.location.href = base.replace(/\/?$/, "/") + p.link;
    });
    nextBtn.addEventListener("click", function () { goScene(sceneIndex + 1); if (!running) draw(); });
    pauseBtn.addEventListener("click", function () {
      paused = !paused;
      pauseBtn.textContent = paused ? "Seguir" : "Pausa";
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      setRunning(true);
    });
    if (reduce) pauseBtn.hidden = true;

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(true); }).observe(root);
    }
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; setRunning(true); });
    var rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (document.body.contains(canvas)) { layout(); draw(); } }, 150); });
    new MutationObserver(function () { readColors(); draw(); }).observe(document.body, { attributes: true, attributeFilter: ["data-md-color-scheme"] });

    layout();
    goScene(0);
    if (reduce) { stillPackets(); }
    draw();
    setRunning(true);
  }

  if (typeof document$ !== "undefined") document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
