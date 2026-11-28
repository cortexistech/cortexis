/* =========================================================
   Cortexis Tech — movimentos da direção B (todas as páginas)
   - entradas suaves na rolagem ([data-rv]); nas páginas internas os
     blocos principais são marcados aqui mesmo
   - telas que se alternam sozinhas ([data-cycle]), com abas clicáveis
   - setas desenhadas à mão que se traçam quando aparecem
   Sem nada disso para quem pede menos movimento no sistema: o conteúdo
   fica parado e visível.
   ========================================================= */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ----- páginas internas: marca os blocos que entram na rolagem ----- */
  const INNER = [
    ".inner .page-hero .wrap > *",
    ".inner .section-title:not(.page-hero .section-title)",
    ".inner .card", ".inner .ops-module", ".inner .portfolio-card", ".inner .service-choice",
    ".inner .service-guide-feature", ".inner .service-guide-support",
    ".inner .ops-feature-copy", ".inner .ops-feature-media", ".inner .ops-frame",
    ".inner .product-panel", ".inner .process-step", ".inner .contact-form",
  ];
  $$(INNER.join(",")).forEach((el) => {
    if (el.hasAttribute("data-rv")) return;
    el.setAttribute("data-rv", "");
    // pequenos atrasos em sequência dentro do mesmo grupo
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute("data-rv"));
    const i = sibs.indexOf(el);
    if (i > 0 && !el.style.getPropertyValue("--d")) el.style.setProperty("--d", Math.min(i, 5) * 0.06 + "s");
  });

  /* ----- entradas na rolagem ----- */
  const items = $$("[data-rv]");
  if (!reduced && "IntersectionObserver" in window) {
    root.classList.add("rv-on");
    const show = (el) => el.classList.add("rv-in");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) requestAnimationFrame(() => show(el));
      else io.observe(el);
    });
    // segurança: nada fica escondido se o observador falhar
    addEventListener("load", () => setTimeout(() => items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight) show(el);
    }), 1200));
  } else {
    items.forEach((el) => el.classList.add("rv-in"));
  }

  /* ----- telas que se alternam ----- */
  $$("[data-cycle]").forEach((screen) => {
    const imgs = $$("img", screen);
    const tabs = screen.closest(".door, section")?.querySelector("[data-cycle-tabs]");
    let i = 0, timer = null, paused = false, visible = false;
    const STEP = 3600;

    const buttons = imgs.map((img, k) => {
      if (!tabs) return null;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (k === 0 ? " on" : "");
      b.innerHTML = `<span>${img.dataset.name || "Tela " + (k + 1)}</span><i></i>`;
      b.setAttribute("aria-pressed", String(k === 0));
      b.addEventListener("click", () => { go(k); restart(); });
      tabs.appendChild(b);
      return b;
    });

    function go(k) {
      imgs[i].classList.remove("on");
      buttons[i]?.classList.remove("on");
      buttons[i]?.setAttribute("aria-pressed", "false");
      i = k;
      // carrega a próxima antes de mostrar
      imgs[i].loading = "eager";
      imgs[i].classList.add("on");
      buttons[i]?.classList.add("on");
      buttons[i]?.setAttribute("aria-pressed", "true");
      if (tabs) tabs.style.setProperty("--run", "0");
      requestAnimationFrame(() => tabs && tabs.style.setProperty("--run", paused || reduced ? "0" : "1"));
    }
    function tick() { if (!paused && visible && !document.hidden) go((i + 1) % imgs.length); }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(tick, STEP); }

    if (tabs) tabs.style.setProperty("--step", STEP + "ms");
    const box = screen.closest(".door") || screen;
    box.addEventListener("mouseenter", () => { paused = true; tabs && tabs.classList.add("paused"); });
    box.addEventListener("mouseleave", () => { paused = false; tabs && tabs.classList.remove("paused"); go(i); });
    box.addEventListener("focusin", () => { paused = true; tabs && tabs.classList.add("paused"); });
    box.addEventListener("focusout", () => { paused = false; tabs && tabs.classList.remove("paused"); });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) go(i); }, { threshold: 0.3 }).observe(screen);
    // pré-carrega as outras telas depois que a página assentar
    addEventListener("load", () => setTimeout(() => imgs.forEach((im) => (im.loading = "eager")), 1500));
    restart();
  });
})();
