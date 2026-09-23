(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heroVideo = document.querySelector(".hero-film video");
  if (heroVideo && !reduceMotion) heroVideo.play().catch(() => {});

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
    ".card, .process-path, .about-text, .about-graphic, .contact-intro, .contact-form"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in-view"));
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
