(() => {
  "use strict";

  const HASH_PAGES = {
    video: "apresentacao.html",
    servicos: "servicos.html",
    processo: "processo.html",
    sobre: "sobre.html",
    contato: "contato.html",
  };
  const pageFile = (location.pathname.split("/").pop() || "index.html");
  if (pageFile === "" || pageFile === "index.html") {
    const dest = HASH_PAGES[location.hash.replace(/^#/, "")];
    if (dest) {
      location.replace(dest);
      return;
    }
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heroVideo = document.querySelector(".hero-film video");
  if (heroVideo && !reduceMotion) heroVideo.play().catch(() => {});

  const institVideo = document.querySelector(".institucional-player video");
  if (institVideo && heroVideo) {
    institVideo.addEventListener("play", () => heroVideo.pause());
    institVideo.addEventListener("pause", () => {
      if (!reduceMotion) heroVideo.play().catch(() => {});
    });
  }

  const INSTIT_SRC = {
    "pt-BR": "assets/cortexis-institucional.mp4",
    "pt-PT": "assets/cortexis-institucional-pt-pt.mp4",
  };
  const TECHDOCS_SRC = {
    "pt-BR": "assets/techdocs-comercial.mp4?v=fala",
    "pt-PT": "assets/techdocs-comercial-pt-pt.mp4?v=pt",
  };
  const TECHDOCS_POSTER = {
    "pt-BR": "assets/techdocs-comercial-poster.jpg?v=telas",
    "pt-PT": "assets/techdocs-comercial-pt-pt-poster.jpg?v=pt",
  };
  const techdocsVideo = document.querySelector("video[data-film='techdocs']");

  function detectPortugueseLocale() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const langs = Array.from(navigator.languages || [navigator.language || ""]);
    if (/^(Europe\/Lisbon|Atlantic\/Madeira|Atlantic\/Azores)$/i.test(tz)) return "pt-PT";
    if (
      /^(America\/(Sao_Paulo|Manaus|Fortaleza|Recife|Bahia|Belem|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Noronha|Araguaina|Maceio|Santarem)|America\/Sao_Paulo)/i.test(
        tz
      )
    ) {
      return "pt-BR";
    }
    if (langs.some((code) => /^pt-PT/i.test(code))) return "pt-PT";
    if (langs.some((code) => /^pt-BR/i.test(code))) return "pt-BR";
    return "pt-BR";
  }

  function applyInstitucionalLocale(locale) {
    if (!institVideo) return;
    const source = institVideo.querySelector("source");
    const current = (source && source.getAttribute("src")) || "";
    // Só o filme institucional troca de faixa. Outros vídeos do site
    // (por exemplo o do TechDocs) ficam com o arquivo que a página indicou.
    if (!current.includes("cortexis-institucional")) return;
    const next = INSTIT_SRC[locale] || INSTIT_SRC["pt-BR"];
    if (current === next && institVideo.getAttribute("data-locale") === locale) return;
    if (!institVideo.paused && institVideo.currentTime > 0.4) return;
    if (source) source.setAttribute("src", next);
    institVideo.setAttribute("data-locale", locale);
    institVideo.setAttribute(
      "title",
      locale === "pt-PT"
        ? "Vídeo institucional da Cortexistech (português de Portugal)"
        : "Vídeo institucional da Cortexistech (português do Brasil)"
    );
    institVideo.load();
  }

  function applyTechdocsLocale(locale) {
    if (!techdocsVideo) return;
    const next = TECHDOCS_SRC[locale] || TECHDOCS_SRC["pt-BR"];
    const source = techdocsVideo.querySelector("source");
    const current = (source && source.getAttribute("src")) || "";
    if (current === next && techdocsVideo.getAttribute("data-locale") === locale) return;
    if (!techdocsVideo.paused && techdocsVideo.currentTime > 0.4) return;
    if (source) source.setAttribute("src", next);
    techdocsVideo.setAttribute("data-locale", locale);
    techdocsVideo.poster = TECHDOCS_POSTER[locale] || TECHDOCS_POSTER["pt-BR"];
    techdocsVideo.setAttribute(
      "title",
      locale === "pt-PT"
        ? "Filme do TechDocs (português de Portugal)"
        : "Filme do TechDocs (português do Brasil)"
    );
    techdocsVideo.load();
  }

  const localeParam = new URLSearchParams(location.search).get("lang") || new URLSearchParams(location.search).get("locale");
  let lockedLocale = null;
  if (localeParam === "pt-PT" || localeParam === "pt") lockedLocale = "pt-PT";
  if (localeParam === "pt-BR" || localeParam === "br") lockedLocale = "pt-BR";
  const initialLocale = lockedLocale || detectPortugueseLocale();
  applyInstitucionalLocale(initialLocale);
  applyTechdocsLocale(initialLocale);
  if (!lockedLocale) {
    fetch("https://api.country.is/")
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.country) return;
        if (data.country === "PT") {
          applyInstitucionalLocale("pt-PT");
          applyTechdocsLocale("pt-PT");
        } else if (data.country === "BR") {
          applyInstitucionalLocale("pt-BR");
          applyTechdocsLocale("pt-BR");
        }
      })
      .catch(() => {});
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");
  if (navToggle && header) {
    navToggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    document.getElementById("main-nav").addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal + process path progress
     --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".card, .process-path, .about-text, .about-graphic, .contact-intro, .contact-form, .institucional-player"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  const markInView = (el) => el.classList.add("in-view");
  const alreadyVisible = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight - 32;
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            markInView(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el) => {
      if (alreadyVisible(el)) markInView(el);
      else io.observe(el);
    });
  } else {
    revealTargets.forEach(markInView);
  }

  /* ---------------------------------------------------------
     Contact form -> EmailJS (static site, no backend)
     --------------------------------------------------------- */
  const EMAILJS_PUBLIC_KEY = "etPTY-7kzhoZXLsB5";
  const EMAILJS_SERVICE_ID = "service_hh2a7pk";
  const EMAILJS_TEMPLATE_ID = "template_tea124a";

  if (window.emailjs) {
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');

      const nome = (data.get("nome") || "").toString().trim();
      const tipo = (data.get("tipo") || "").toString().trim();
      const mensagem = (data.get("mensagem") || "").toString().trim();

      const params = {
        name: nome,
        email: (data.get("email") || "").toString().trim(),
        title: `Novo projeto: ${tipo}`,
        message: `Tipo de projeto: ${tipo}\n\n${mensagem}`,
      };

      if (submitBtn) submitBtn.disabled = true;
      if (formNote) formNote.textContent = "Enviando mensagem...";

      window.emailjs
        .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
        .then(() => {
          if (formNote) formNote.textContent = "Mensagem enviada! A gente responde em breve.";
          form.reset();
        })
        .catch(() => {
          if (formNote) {
            formNote.textContent =
              "Não foi possível enviar agora. Tente novamente ou escreva para cortexistech@gmail.com.";
          }
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------------------------------------------------------
     Full-screen star field behind the hero film
     --------------------------------------------------------- */
  const canvas = document.getElementById("constellation");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  let width = 0, height = 0, dpr = 1;
  let stars = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(70, Math.min(190, Math.round(width * height / 7800)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: .35 + Math.random() * 1.5,
      glow: Math.random() > .91,
      phase: Math.random() * Math.PI * 2,
      alpha: .25 + Math.random() * .65,
    }));
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const twinkle = reduceMotion ? 1 : .72 + Math.sin(time * .0008 + star.phase) * .28;
      const alpha = star.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(190, 231, 255, ${alpha})`;
      if (star.glow) {
        ctx.shadowColor = "rgba(88, 217, 231, .75)";
        ctx.shadowBlur = 8;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
})();
