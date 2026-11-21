/* Keep animation libraries off mobile and reduced-motion loads. */
(() => {
  const needsMotion = matchMedia("(min-width: 761px) and (prefers-reduced-motion: no-preference)").matches;
  const scripts = [];
  if (needsMotion) {
    scripts.push("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js");
    scripts.push("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js");
  }
  scripts.push("js/cx.js");
  scripts.push(document.documentElement.lang === "pt-PT" ? "js/home.js?l=pt" : "js/home.js");

  for (const src of scripts) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    document.body.appendChild(script);
  }
})();
