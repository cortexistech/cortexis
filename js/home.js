/* =========================================================
   Cortexis Tech — home
   Depende de js/cx.js (carregado antes).
   ========================================================= */
(() => {
  "use strict";

  /* Âncoras antigas da home que viraram páginas próprias */
  const HASH_PAGES = { video: "sobre.html", servicos: "servicos.html", processo: "sobre.html#processo", sobre: "sobre.html", contato: "contato.html" };
  const dest = HASH_PAGES[location.hash.replace(/^#/, "")];
  if (dest) { location.replace(dest); return; }

  const { $, $$, reduced, fine } = window.CX;
  const hasGsap = !!window.gsap;
  const anim = hasGsap && !reduced;
  const fmt = (v, pre = "", suf = "") => pre + Math.round(v).toLocaleString("pt-BR") + suf;

  /* ============ DADOS (ilustrativos) ============ */
  const PRODUCTS = {
    techclinica: {
      who: "Para clínicas e consultórios", name: "TechClínica", page: "techclinica.html", cta: "contato.html?assunto=techclinica",
      text: "Agenda, prontuário, financeiro e estoque no mesmo acesso, com o paciente confirmando a consulta pelo e-mail.",
      shots: [["painel", "Painel"], ["agenda", "Agenda"], ["confirmar", "Confirmação pelo paciente"], ["prontuario", "Prontuário"], ["financeiro", "Financeiro"], ["estoque", "Estoque"], ["relatorios", "Relatórios"], ["mobile", "No celular"]].map(([f, l]) => ({ src: `img/clinica/${f}.webp`, label: l })),
      modules: [
        { name: "Agenda", top: "Agenda · Hoje", kpis: [["Consultas hoje", 18], ["Confirmadas", 15], ["Encaixes", 2]], bars: [40, 55, 62, 48, 70, 82, 76, 64, 58, 73, 88, 66], line: [30, 42, 38, 52, 60, 58, 66, 72, 68, 78, 84, 80], rows: [["08:30", "Ana Ribeiro", "Confirmada", 1], ["09:15", "Carlos M.", "Confirmada", 1], ["10:00", "Júlia P.", "Aguardando", 0], ["10:45", "Rafael T.", "Confirmada", 1]] },
        { name: "Prontuário", top: "Prontuário · Mês", kpis: [["Atendimentos", 342], ["Evoluções", 128], ["Criptografados", 100, "", "%"]], bars: [62, 58, 70, 66, 74, 68, 80, 77, 72, 84, 79, 90], line: [50, 54, 52, 60, 58, 64, 62, 70, 72, 74, 78, 82], rows: [["Evolução", "Ana Ribeiro", "Assinada", 1], ["Anamnese", "Pedro L.", "Rascunho", 0], ["Receita", "Carlos M.", "Emitida", 1], ["Atestado", "Júlia P.", "Emitido", 1]] },
        { name: "Financeiro", top: "Financeiro · Mês", kpis: [["Recebido", 24380, "R$ "], ["A receber", 6120, "R$ "], ["Ticket médio", 245, "R$ "]], bars: [35, 48, 44, 60, 52, 66, 58, 72, 70, 64, 82, 90], line: [20, 28, 34, 40, 46, 50, 58, 62, 66, 72, 80, 88], rows: [["Consulta", "Ana Ribeiro", "Pago", 1], ["Retorno", "Carlos M.", "Pago", 1], ["Procedim.", "Júlia P.", "Pendente", 0], ["Consulta", "Rafael T.", "Pago", 1]] },
        { name: "Estoque", top: "Estoque · Itens", kpis: [["Itens ativos", 214], ["Abaixo do mínimo", 6], ["Vencem em 30 dias", 3]], bars: [80, 74, 70, 66, 60, 72, 68, 58, 54, 62, 50, 46], line: [78, 74, 72, 66, 64, 62, 58, 56, 52, 50, 48, 44], rows: [["Luvas M", "1.240 un", "OK", 1], ["Seringa 5ml", "38 un", "Repor", 0], ["Gaze", "410 un", "OK", 1], ["Anestésico", "12 un", "Repor", 0]] },
      ],
    },
    ops: {
      who: "Para empresas", name: "Cortexis Ops", page: "cortexis-ops.html", cta: "contato.html?assunto=cortexis-ops",
      text: "Documentos, arquivo, frota, vendas, compras, estoque, financeiro e indicadores ligados entre si.",
      shots: [["indicadores", "Indicadores"], ["techdocs", "TechDocs"], ["techarquivo", "TechArquivo"], ["techmaint", "TechMaint"], ["os", "Ordens de serviço"], ["vendas", "Vendas"], ["funil", "Funil comercial"], ["caixas", "Caixas"], ["financeiro", "Financeiro"], ["perfis", "Perfis e permissões"], ["auditoria", "Auditoria"], ["mobile", "No celular"]].map(([f, l]) => ({ src: `img/ops/${f}.webp`, label: l })),
      modules: [
        { name: "Documentos", top: "TechDocs · Vigência", kpis: [["Documentos ativos", 1286], ["Vencem em 30 dias", 14], ["Revisões pendentes", 7]], bars: [52, 60, 58, 64, 70, 66, 74, 78, 72, 80, 84, 88], line: [40, 44, 48, 50, 56, 58, 62, 66, 68, 72, 76, 80], rows: [["ISO-014", "Licença ambiental", "Vigente", 1], ["RH-221", "ASO equipe B", "Vence 12d", 0], ["FR-090", "Seguro frota", "Vigente", 1], ["JU-031", "Contrato social", "Vigente", 1]] },
        { name: "Frota", top: "TechMaint · Frota", kpis: [["Veículos", 42], ["OS abertas", 9], ["Disponibilidade", 94, "", "%"]], bars: [88, 92, 90, 86, 94, 91, 89, 95, 93, 90, 96, 94], line: [70, 74, 72, 68, 76, 74, 72, 80, 78, 76, 82, 80], rows: [["OS-1182", "Troca de óleo", "Concluída", 1], ["OS-1183", "Pneus dianteiros", "Em curso", 0], ["OS-1184", "Revisão 50 mil", "Agendada", 0], ["OS-1185", "Freios", "Concluída", 1]] },
        { name: "Estoque", top: "TechEstoque · Giro", kpis: [["SKUs", 3410], ["Pedidos de compra", 23], ["Giro médio (dias)", 18]], bars: [46, 52, 60, 55, 62, 70, 64, 58, 66, 72, 68, 76], line: [60, 58, 54, 56, 50, 48, 52, 46, 44, 42, 40, 38], rows: [["PC-882", "Fornecedor A", "Aprovado", 1], ["PC-883", "Fornecedor C", "Cotação", 0], ["PC-884", "Fornecedor B", "Recebido", 1], ["PC-885", "Fornecedor A", "Aprovado", 1]] },
        { name: "Financeiro", top: "TechFinanceiro · Caixa", kpis: [["Saldo", 182450, "R$ "], ["A receber", 64300, "R$ "], ["A pagar", 41780, "R$ "]], bars: [40, 46, 52, 48, 58, 62, 60, 70, 66, 74, 78, 84], line: [30, 36, 40, 44, 48, 54, 56, 62, 64, 70, 74, 80], rows: [["Receita", "Contrato 0412", "Recebido", 1], ["Despesa", "Combustível", "Pago", 1], ["Receita", "Contrato 0419", "Aberto", 0], ["Despesa", "Manutenção", "Pago", 1]] },
      ],
    },
  };

  /* ============ PAINÉIS ============ */
  const W = 400, H = 140, N = 12, BW = 20, STEP = W / N;
  const linePath = (a) => a.map((v, i) => `${i ? "L" : "M"}${(i * STEP + STEP / 2).toFixed(1)} ${(H - (v / 100) * H * 0.92).toFixed(1)}`).join(" ");
  const areaPath = (a) => linePath(a) + ` L${((N - 1) * STEP + STEP / 2).toFixed(1)} ${H} L${(STEP / 2).toFixed(1)} ${H} Z`;

  function buildDash(card, key) {
    const cfg = PRODUCTS[key], m = cfg.modules[0];
    $(".dash", card).innerHTML = `
    <div class="tilt"><div class="plane">
      <div class="d-side"><div class="dot"></div>${cfg.modules.map((_, i) => `<span class="${i ? "" : "on"}" style="width:${70 - i * 8}%"></span>`).join("")}<span style="width:40%"></span><span style="width:55%"></span></div>
      <div class="d-main">
        <div class="d-top"><span class="d-title">${m.top}</span><span class="live">Ao vivo</span></div>
        <div class="d-kpis">${m.kpis.map((k) => `<div class="kpi"><span class="kpi-l">${k[0]}</span><span class="kpi-v">${fmt(k[1], k[2], k[3])}</span></div>`).join("")}</div>
        <div class="d-chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs><linearGradient id="gradA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--acid)" stop-opacity=".22"/><stop offset="1" style="stop-color:var(--acid)" stop-opacity="0"/></linearGradient></defs>
          ${[0.25, 0.5, 0.75].map((f) => `<line class="grid" x1="0" x2="${W}" y1="${H * f}" y2="${H * f}"/>`).join("")}
          ${m.bars.map((v, i) => `<rect class="bar" x="${i * STEP + (STEP - BW) / 2}" width="${BW}" y="${H - (v / 100) * H}" height="${(v / 100) * H}" rx="1.5"/>`).join("")}
          <path class="area" d="${areaPath(m.line)}"/><path class="ln" d="${linePath(m.line)}"/>
        </svg></div>
        <div class="d-rows">${m.rows.map((r) => `<div class="d-row"><span>${r[0]}</span><span>${r[1]}</span><span class="st ${r[3] ? "ok" : ""}">${r[2]}</span></div>`).join("")}</div>
      </div>
    </div></div>`;
    card._mod = 0;
    const tabs = $(".tabs", card);
    cfg.modules.forEach((mod, i) => {
      const b = document.createElement("button");
      b.className = "tab"; b.type = "button"; b.textContent = mod.name; b.setAttribute("aria-pressed", i === 0);
      const go = () => { card._user = true; setModule(card, key, i); };
      b.addEventListener("mouseenter", go); b.addEventListener("focus", go); b.addEventListener("click", go);
      tabs.appendChild(b);
    });
    requestAnimationFrame(() => moveInd(card, 0, true));
  }

  function moveInd(card, i, instant) {
    const tab = $$(".tab", card)[i], ind = $(".ind", card);
    if (!tab) return;
    const p = { x: tab.offsetLeft, width: tab.offsetWidth, top: tab.offsetTop + tab.offsetHeight - 2 };
    if (anim && !instant) gsap.to(ind, { ...p, duration: 0.6, ease: "expo.out" });
    else if (hasGsap) gsap.set(ind, p);
    else { ind.style.transform = `translateX(${p.x}px)`; ind.style.width = p.width + "px"; ind.style.top = p.top + "px"; }
  }

  function setModule(card, key, i) {
    if (card._mod === i && !card._force) return;
    card._force = false; card._mod = i;
    const m = PRODUCTS[key].modules[i];
    $$(".tab", card).forEach((t, j) => t.setAttribute("aria-pressed", j === i));
    $$(".d-side span", card).forEach((s, j) => s.classList.toggle("on", j === i));
    moveInd(card, i);
    $(".d-title", card).textContent = m.top;
    const kv = $$(".kpi-v", card), kl = $$(".kpi-l", card);
    m.kpis.forEach((k, j) => {
      kl[j].textContent = k[0];
      if (!anim) { kv[j].textContent = fmt(k[1], k[2], k[3]); return; }
      const o = { v: 0 };
      gsap.to(o, { v: k[1], duration: 1.1, ease: "expo.out", onUpdate: () => (kv[j].textContent = fmt(o.v, k[2], k[3])) });
    });
    const rects = $$(".bar", card);
    m.bars.forEach((v, j) => {
      const h = (v / 100) * H;
      if (anim) gsap.to(rects[j], { attr: { y: H - h, height: h }, duration: 0.9, ease: "expo.out", delay: j * 0.025 });
      else { rects[j].setAttribute("y", H - h); rects[j].setAttribute("height", h); }
    });
    const ln = $(".ln", card), ar = $(".area", card);
    if (anim) { gsap.to(ln, { attr: { d: linePath(m.line) }, duration: 1, ease: "expo.out" }); gsap.to(ar, { attr: { d: areaPath(m.line) }, duration: 1, ease: "expo.out" }); }
    else { ln.setAttribute("d", linePath(m.line)); ar.setAttribute("d", areaPath(m.line)); }
    const rows = $$(".d-row", card);
    const apply = () => m.rows.forEach((r, j) => { const c = rows[j].children; c[0].textContent = r[0]; c[1].textContent = r[1]; c[2].textContent = r[2]; c[2].classList.toggle("ok", !!r[3]); });
    if (anim) gsap.to(rows, { opacity: 0, x: -10, duration: 0.18, stagger: 0.03, ease: "power2.in", onComplete: () => { apply(); gsap.fromTo(rows, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, ease: "expo.out" }); } });
    else apply();
  }

  function buildIn(card) {
    if (!anim || card._built) return;
    card._built = true;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from($(".plane", card), { rotateX: 55, rotateY: -40, z: -200, opacity: 0, duration: 1.6 })
      .from($$(".d-side span, .d-side .dot", card), { scaleX: 0, opacity: 0, duration: 0.8, stagger: 0.05 }, 0.3)
      .from($(".d-top", card), { opacity: 0, y: -10, duration: 0.6 }, 0.4)
      .from($$(".kpi", card), { z: -120, opacity: 0, duration: 1, stagger: 0.08 }, 0.5)
      .from($$(".bar", card), { attr: { y: H, height: 0 }, duration: 1, stagger: 0.03 }, 0.6)
      .from($(".ln", card), { opacity: 0, duration: 0.8 }, 0.9)
      .from($$(".d-row", card), { x: -20, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.8);
    card._force = true;
    setModule(card, card.dataset.product, 0);
  }

  function tilt(card) {
    if (!fine || !anim) return;
    const tw = $(".tilt", card), dash = $(".dash", card);
    const rx = gsap.quickTo(tw, "rotationX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(tw, "rotationY", { duration: 0.8, ease: "power3.out" });
    dash.addEventListener("mousemove", (e) => { const r = dash.getBoundingClientRect(); rx(-((e.clientY - r.top) / r.height - 0.5) * 12); ry(((e.clientX - r.left) / r.width - 0.5) * 18); });
    dash.addEventListener("mouseleave", () => { rx(0); ry(0); });
  }

  $$(".product").forEach((card) => {
    const key = card.dataset.product;
    buildDash(card, key);
    tilt(card);
    card.addEventListener("mouseleave", () => (card._user = false));
    new IntersectionObserver((es) => es.forEach((en) => { card._visible = en.isIntersecting; if (en.isIntersecting) buildIn(card); }), { threshold: 0.35 }).observe(card);
    if (!reduced) setInterval(() => { if (card._visible && !card._user && !document.hidden) setModule(card, key, (card._mod + 1) % PRODUCTS[key].modules.length); }, 4200);
  });
  addEventListener("resize", () => $$(".product").forEach((c) => moveInd(c, c._mod || 0, true)));
  document.fonts && document.fonts.ready.then(() => $$(".product").forEach((c) => moveInd(c, c._mod || 0, true)));

  /* ============ JANELA COM AS TELAS REAIS ============ */
  const pd = $("#pd");
  let pdKey = null;
  function pdShow(i) {
    const p = PRODUCTS[pdKey], s = p.shots[i], img = $("#pdImg");
    $$("#pdMods button").forEach((b, j) => b.setAttribute("aria-current", j === i));
    $("#pdCap").textContent = s.label;
    $("#pdIdx").textContent = String(i + 1).padStart(2, "0") + " / " + String(p.shots.length).padStart(2, "0");
    const swap = () => { img.src = s.src; img.alt = `Tela ${s.label} do ${p.name}`; };
    if (anim) gsap.fromTo(img, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.8, ease: "expo.out", onStart: swap });
    else swap();
  }
  function pdOpen(key, ev) {
    pdKey = key;
    const p = PRODUCTS[key];
    $("#pdWho").textContent = p.who; $("#pd-title").textContent = p.name; $("#pdText").textContent = p.text;
    $("#pdCta").href = p.cta; $("#pdMore").href = p.page;
    $("#pdMods").innerHTML = p.shots.map((s, i) => `<li><button type="button"><span>${s.label}</span><span>${String(i + 1).padStart(2, "0")}</span></button></li>`).join("");
    $$("#pdMods button").forEach((b, i) => { b.addEventListener("click", () => pdShow(i)); if (fine) b.addEventListener("mouseenter", () => pdShow(i)); });
    pdShow(0);
    window.CX.lenis && window.CX.lenis.stop();
    pd.showModal();
    if (anim) {
      const x = ev && ev.clientX ? ev.clientX : innerWidth / 2, y = ev && ev.clientY ? ev.clientY : innerHeight / 2;
      pd._origin = `${x}px ${y}px`;
      gsap.fromTo(pd, { clipPath: `circle(0% at ${pd._origin})` }, { clipPath: `circle(150% at ${pd._origin})`, duration: 1, ease: "expo.inOut" });
      gsap.from($$(".pd-copy > *, .pd-stage > *", pd), { y: 40, opacity: 0, duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.45 });
    }
  }
  function pdClose() {
    const done = () => { pd.close(); pd.style.clipPath = ""; window.CX.lenis && window.CX.lenis.start(); };
    if (anim) gsap.to(pd, { clipPath: `circle(0% at ${pd._origin || "50% 50%"})`, duration: 0.8, ease: "expo.inOut", onComplete: done });
    else done();
  }
  $$("[data-open]").forEach((b) => b.addEventListener("click", (e) => pdOpen(b.dataset.open, e)));
  $("#pdClose").addEventListener("click", pdClose);
  pd.addEventListener("cancel", (e) => { e.preventDefault(); pdClose(); });

  /* ============ MOVIMENTO ============ */
  if (hasGsap) {
    const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    if (reduced) intro.progress(1);
    else intro
      .from(".hero h1 .li", { yPercent: 115, skewY: 6, duration: 1.6, stagger: 0.12 }, 0.1)
      .from(".hero-in", { y: 24, opacity: 0, duration: 1.2, stagger: 0.07 }, 0.45);

    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" }, (ctx) => {
      const { motion, wide } = ctx.conditions;
      if (!motion) return;

      gsap.to(".hero h1", { yPercent: -25, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

      const man = $("#manifesto");
      if (!man._split) { window.CX.splitWords(man, "mw"); man._split = true; }
      gsap.fromTo($$(".mw", man), { opacity: 0.12 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: man, start: "top 80%", end: "bottom 50%", scrub: true } });

      gsap.from(".t-item", { y: 70, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".t-grid", start: "top 85%" } });
      gsap.timeline({ scrollTrigger: { trigger: ".case-grid", start: "top 80%" }, defaults: { ease: "expo.out" } })
        .from(".case-frame", { clipPath: "inset(12% 12% 12% 12% round 10px)", duration: 1.6 })
        .from(".case-img", { scale: 1.25, duration: 1.8 }, 0)
        .from(".case-badge", { y: 30, opacity: 0, duration: 1 }, 0.5)
        .from(".case-copy > *, .case-steps li", { y: 30, opacity: 0, duration: 1, stagger: 0.06 }, 0.2);
      gsap.from(".w-row", { y: 50, opacity: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".w-list", start: "top 88%" } });

      if (wide) {
        const sec = $("#produtos"), track = $("#hTrack");
        sec.classList.add("is-horizontal");
        requestAnimationFrame(() => $$(".product").forEach((c) => moveInd(c, c._mod || 0, true)));
        const dist = () => track.scrollWidth - innerWidth;
        const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$(".product, .product-mini", track).forEach((p) => gsap.from(p, { scale: 0.93, opacity: 0.35, ease: "none", scrollTrigger: { trigger: p, containerAnimation: tween, start: "left right", end: "left 45%", scrub: true } }));
        return () => { sec.classList.remove("is-horizontal"); gsap.set(track, { clearProps: "transform" }); };
      }
    });

    gsap.fromTo(".cta", { "--cta": 0 }, { "--cta": 1, ease: "none", scrollTrigger: { trigger: ".cta", start: "top 75%", end: "top 25%", scrub: true } });

    /* prévia dos projetos seguindo o cursor */
    if (fine && !reduced) {
      const pv = $("#preview"), img = $("img", pv);
      const px = gsap.quickTo(pv, "x", { duration: 0.7, ease: "power3.out" }), py = gsap.quickTo(pv, "y", { duration: 0.7, ease: "power3.out" });
      gsap.set(pv, { xPercent: -50, yPercent: -50 });
      $$(".w-row").forEach((row) => {
        row.addEventListener("mouseenter", () => { img.src = row.dataset.img; gsap.to(pv, { opacity: 1, scale: 1, rotate: -3, duration: 0.6, ease: "expo.out" }); });
        row.addEventListener("mouseleave", () => gsap.to(pv, { opacity: 0, scale: 0.6, rotate: 0, duration: 0.5, ease: "expo.out" }));
      });
      addEventListener("pointermove", (e) => { px(e.clientX + 40); py(e.clientY); }, { passive: true });
    }
  }

  /* ============ CARACTERES QUE FORMAM O NÚMERO (sob medida) ============ */
  (function () {
    const cv = $("#glyphs");
    if (!cv || reduced) return;
    const sec = cv.parentElement, ctx = cv.getContext("2d");
    const CH = "{}[]<>/=;:()01+*#&|$_".split("");
    const COUNT = fine ? 1000 : 360;
    let w = 0, h = 0, parts = [], running = false, hovering = false, cA = "36,127,144", cB = "82,99,110";
    const colors = () => {
      const cs = getComputedStyle(document.documentElement);
      cA = cs.getPropertyValue("--cyan-rgb").trim().split(/\s+/).join(",") || cA;
      cB = cs.getPropertyValue("--ti-rgb").trim().split(/\s+/).join(",") || cB;
    };
    colors();
    document.addEventListener("theme:change", colors);
    const size = () => { const dpr = Math.min(devicePixelRatio, 2), r = sec.getBoundingClientRect(); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const init = () => { size(); parts = Array.from({ length: COUNT }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: -(0.1 + Math.random() * 0.35), c: CH[(Math.random() * CH.length) | 0], tx: 0, ty: 0, t: false, a: 0.1 })); };
    function targets(item) {
      const sr = sec.getBoundingClientRect(), r = item.getBoundingClientRect();
      const off = document.createElement("canvas"), oc = off.getContext("2d");
      off.width = Math.ceil(r.width); off.height = Math.ceil(r.height);
      const fs = Math.min(r.height * 1.05, r.width * 0.62);
      oc.font = `italic 400 ${fs}px "Instrument Serif", Georgia, serif`;
      oc.textAlign = "right"; oc.textBaseline = "middle"; oc.fillStyle = "#000";
      oc.fillText(item.dataset.n, r.width * 0.96, r.height * 0.54);
      const data = oc.getImageData(0, 0, off.width, off.height).data, pts = [], step = 7;
      for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 128) pts.push([r.left - sr.left + x, r.top - sr.top + y]);
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      return pts;
    }
    function form(item) {
      const pts = targets(item);
      hovering = true;
      parts.map((_, i) => i).sort(() => Math.random() - 0.5).forEach((idx, k) => {
        const p = parts[idx];
        if (k < pts.length) { p.t = true; p.tx = pts[k][0]; p.ty = pts[k][1]; } else p.t = false;
      });
    }
    const release = () => { hovering = false; parts.forEach((p) => { if (p.t) { p.t = false; p.vx = (Math.random() - 0.5) * 1.2; p.vy = -Math.random() * 1.2; } }); };
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of parts) {
        if (p.t) { p.x += (p.tx - p.x) * 0.09; p.y += (p.ty - p.y) * 0.09; p.a += (0.9 - p.a) * 0.08; }
        else {
          p.vx *= 0.97; p.vy += (-0.18 - p.vy) * 0.02; p.x += p.vx; p.y += p.vy;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          p.a += ((hovering ? 0.06 : 0.16) - p.a) * 0.05;
        }
        ctx.fillStyle = p.t ? `rgba(${cA},${p.a.toFixed(3)})` : `rgba(${cB},${p.a.toFixed(3)})`;
        ctx.fillText(p.c, p.x, p.y);
      }
      if (Math.random() < 0.02) parts[(Math.random() * parts.length) | 0].c = CH[(Math.random() * CH.length) | 0];
      requestAnimationFrame(tick);
    }
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { if (!parts.length) init(); if (!running) { running = true; requestAnimationFrame(tick); } }
      else running = false;
    })).observe(sec);
    new ResizeObserver(() => { if (parts.length) size(); }).observe(sec);
    if (fine) $$(".t-item", sec).forEach((it) => {
      const go = () => (document.fonts ? document.fonts.load('italic 200px "Instrument Serif"') : Promise.resolve()).then(() => form(it));
      it.addEventListener("mouseenter", go); it.addEventListener("focus", go);
      it.addEventListener("mouseleave", release); it.addEventListener("blur", release);
    });
  })();
})();
