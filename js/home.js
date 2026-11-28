/* =========================================================
   Cortexis Tech — home
   A home não tem animações próprias: só leva as âncoras antigas
   para as páginas que as substituíram.
   ========================================================= */
(() => {
  "use strict";
  const HASH_PAGES = { video: "sobre.html", servicos: "sob-medida.html", projetos: "sob-medida.html#projetos", processo: "sobre.html#processo", sobre: "sobre.html", contato: "contato.html", produtos: "#inicio", "sob-medida": "sob-medida.html" };
  const dest = HASH_PAGES[location.hash.replace(/^#/, "")];
  if (dest && dest !== location.hash) location.replace(dest);
})();
