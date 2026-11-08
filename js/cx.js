/* =========================================================
   Cortexis Tech — comportamento compartilhado (todas as páginas)
   Menu, scroll suave, cabeçalho, botões magnéticos, cursor e revelações.
   Funciona sem GSAP/Lenis: nesse caso o conteúdo aparece sem animação.
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const hasGsap = !!window.gsap;
  const CX = (window.CX = { $, $$, reduced, fine, hasGsap, lenis: null });

  /* ----- página atual no menu ----- */
  const page = location.pathname.split("/").pop() || "index.html";
  $$(".hdr-nav a, .mnav a").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("#")[0].split("?")[0];
    if (href === page) a.setAttribute("aria-current", "page");
  });

  /* ----- versão do site: Brasil ou Portugal -----
     O Firebase Hosting escolhe a versão pelo país do IP. O cookie
     firebase-country-override deixa o visitante trocar manualmente. */
  const isPT = document.documentElement.lang === "pt-PT";
  $$(".lang-switch [data-country]").forEach((b) => {
    b.setAttribute("aria-pressed", (b.dataset.country === "pt") === isPT);
    b.addEventListener("click", () => {
      if ((b.dataset.country === "pt") === isPT) return;
      document.cookie = `firebase-country-override=${b.dataset.country}; path=/; max-age=31536000; SameSite=Lax; Secure`;
      location.reload();
    });
  });

  /* ----- menu móvel ----- */
  const btn = $("#menuBtn"), mnav = $("#mnav");
  if (btn && mnav) {
    const set = (open) => {
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      mnav.hidden = !open;
      document.documentElement.style.overflow = open ? "hidden" : "";
      CX.lenis && (open ? CX.lenis.stop() : CX.lenis.start());
      if (open && hasGsap && !reduced) gsap.from($$("a", mnav), { y: 30, opacity: 0, duration: 0.8, stagger: 0.05, ease: "expo.out" });
    };
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    mnav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !mnav.hidden) { set(false); btn.focus(); } });
    matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) set(false); });
  }

  /* ----- botões com preenchimento líquido ----- */
  $$("[data-liquid]").forEach((b) => {
    const pos = (e) => { const r = b.getBoundingClientRect(); b.style.setProperty("--x", e.clientX - r.left + "px"); b.style.setProperty("--y", e.clientY - r.top + "px"); };
    b.addEventListener("mouseenter", pos);
    b.addEventListener("mouseleave", pos);
  });

  /* ----- divisão de texto em palavras ----- */
  CX.splitWords = function (el, cls = "w") {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const o = document.createElement("span");
            o.className = cls;
            if (cls === "w") { const i = document.createElement("span"); i.className = "wi"; i.textContent = part; o.appendChild(i); }
            else o.textContent = part;
            frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ----- scroll suave ----- */
  if (!reduced && window.Lenis) {
    const lenis = (CX.lenis = new Lenis({ lerp: 0.09, smoothWheel: true }));
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = $(id);
      if (t) { e.preventDefault(); lenis.scrollTo(t, { duration: 1.6, offset: id === "#inicio" ? 0 : -80 }); }
    }));
  }

  /* ----- barra de progresso e cabeçalho ----- */
  const progress = $("#progress");
  if (progress) gsap.to(progress, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  const hdr = $("#hdr");
  if (hdr) {
    let lastY = 0;
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => {
      const y = self.scroll();
      const dialogOpen = !!$("dialog[open]");
      hdr.classList.toggle("is-solid", y > 40);
      hdr.classList.toggle("is-hidden", y > lastY && y > 400 && !dialogOpen && !(mnav && !mnav.hidden));
      lastY = y;
    } });
    hdr.classList.toggle("is-solid", scrollY > 40);
  }

  /* ----- revelações ----- */
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    $$("[data-reveal], .inner .page-hero h1, .inner h2.section-title").forEach((el) => {
      if (!el._split) { CX.splitWords(el); el._split = true; }
      gsap.from($$(".wi", el), { yPercent: 110, rotate: 3, duration: 1.3, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$("[data-fade]").forEach((el, i) => gsap.from(el, { y: 50, opacity: 0, duration: 1.1, delay: (i % 3) * 0.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    $$("[data-stagger]").forEach((wrap) => gsap.from(wrap.children, { y: 50, opacity: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: wrap, start: "top 88%" } }));
  });

  /* ----- botões magnéticos e cursor ----- */
  if (fine && !reduced) {
    const mags = $$("[data-magnetic]").map((el) => {
      const lbl = $(".lbl", el) || el;
      return {
        el, lbl, near: false,
        xTo: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
        yTo: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
        lx: gsap.quickTo(lbl, "x", { duration: 0.6, ease: "power3.out" }),
        ly: gsap.quickTo(lbl, "y", { duration: 0.6, ease: "power3.out" }),
      };
    });
    let mx = 0, my = 0, pending = false;
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        mags.forEach((m) => {
          const r = m.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - (gsap.getProperty(m.el, "x") || 0);
          const cy = r.top + r.height / 2 - (gsap.getProperty(m.el, "y") || 0);
          const dx = mx - cx, dy = my - cy, R = Math.max(r.width, r.height) * 0.9 + 40;
          if (Math.hypot(dx, dy) < R) { m.xTo(dx * 0.3); m.yTo(dy * 0.36); m.lx(dx * 0.1); m.ly(dy * 0.1); m.near = true; }
          else if (m.near) { m.near = false; m.xTo(0); m.yTo(0); m.lx(0); m.ly(0); }
        });
      });
    }, { passive: true });

    const cur = $("#cursor");
    if (cur) {
      const cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3.out" });
      const cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3.out" });
      addEventListener("pointermove", (e) => { cur.classList.add("is-on"); cx(e.clientX); cy(e.clientY); }, { passive: true });
      document.addEventListener("pointerleave", () => cur.classList.remove("is-on"));
      document.addEventListener("pointerover", (e) => cur.classList.toggle("is-hover", !!e.target.closest("a,button,[role=button]")));
    }
  }

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
