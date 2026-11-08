/* =========================================================
   Cortexis Tech — fundo do hero em WebGL (Three.js)
   Pontos espalhados que se organizam numa grade 3D ("dados em ordem").
   Se o WebGL falhar, o canvas é removido e o hero segue só com tipografia.
   ========================================================= */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("gl");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    const DPR = Math.min(devicePixelRatio, 2);
    renderer.setPixelRatio(DPR);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

    const COLS = 48, ROWS = 22, LAYERS = 4, COUNT = COLS * ROWS * LAYERS;
    const pos = new Float32Array(COUNT * 3), chaos = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT);
    let k = 0;
    for (let l = 0; l < LAYERS; l++) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      pos[k * 3] = (c / (COLS - 1) - 0.5) * 15;
      pos[k * 3 + 1] = (r / (ROWS - 1) - 0.5) * 6.6;
      pos[k * 3 + 2] = (l / (LAYERS - 1) - 0.5) * 3.2;
      const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), rad = 4 + Math.random() * 7;
      chaos[k * 3] = rad * Math.sin(v) * Math.cos(u);
      chaos[k * 3 + 1] = rad * Math.sin(v) * Math.sin(u) * 0.7;
      chaos[k * 3 + 2] = rad * Math.cos(v);
      seed[k] = Math.random();
      k++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aChaos", new THREE.BufferAttribute(chaos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    const uniforms = {
      uTime: { value: 0 }, uOrder: { value: reduced ? 1 : 0 }, uPR: { value: DPR }, uMouse: { value: new THREE.Vector2() },
      uColA: { value: new THREE.Color(0x247f90) }, uColB: { value: new THREE.Color(0x174a66) },
      uBoost: { value: 1 }, uSize: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      vertexShader: `
        uniform float uTime; uniform float uOrder; uniform float uPR; uniform vec2 uMouse; uniform float uSize;
        attribute vec3 aChaos; attribute float aSeed;
        varying float vA; varying float vAcc;
        void main(){
          float t = clamp(uOrder*1.5 - aSeed*.5, 0., 1.);
          t = t*t*(3.-2.*t);
          vec3 p = mix(aChaos, position, t);
          p += (1.-t)*vec3(sin(uTime*.3+aSeed*20.), cos(uTime*.25+aSeed*13.), sin(uTime*.2+aSeed*7.))*.35;
          p.z += sin(p.x*.55 + uTime*.7)*cos(p.y*.4 + uTime*.4)*.22*t;
          float d = distance(p.xy, uMouse*vec2(7.5,3.3));
          p.z += smoothstep(2.6, 0., d)*.9*t;
          vec4 mv = modelViewMatrix*vec4(p,1.);
          gl_Position = projectionMatrix*mv;
          vAcc = step(.985, aSeed);
          float pulse = .5 + .5*sin(uTime*2. + aSeed*40.);
          gl_PointSize = (2.6 + vAcc*3.*pulse + smoothstep(2.6,0.,d)*2.4) * uSize * uPR * (12./-mv.z);
          vA = smoothstep(30., 8., -mv.z) * (.45 + .55*t);
        }`,
      fragmentShader: `
        uniform vec3 uColA; uniform vec3 uColB; uniform float uBoost;
        varying float vA; varying float vAcc;
        void main(){
          float r = length(gl_PointCoord - .5);
          if(r > .5) discard;
          vec3 col = mix(uColA, uColB, vAcc);
          gl_FragColor = vec4(col, min(1., smoothstep(.5, .1, r)*vA*1.1*uBoost));
        }`,
    });
    const group = new THREE.Group();
    group.add(new THREE.Points(geo, mat));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x174a66, transparent: true, opacity: 0 });
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(15.6, 7.2, 3.6)), lineMat));
    group.rotation.set(-0.42, 0.32, 0.04);
    scene.add(group);

    // Cores por tema: no claro, pontos azul-petróleo; no escuro, ciano e verde-ácido.
    const applyTheme = () => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      uniforms.uColA.value.set(dark ? 0x4fd3e2 : 0x247f90);
      uniforms.uColB.value.set(dark ? 0xc5f24a : 0x174a66);
      mat.blending = THREE.NormalBlending;
      uniforms.uBoost.value = dark ? 2.2 : 1;   // no escuro, pontos mais opacos e maiores
      uniforms.uSize.value = dark ? 1.3 : 1;
      mat.needsUpdate = true;
      lineMat.color.set(dark ? 0x4fd3e2 : 0x174a66);
      if (reduced) renderer.render(scene, camera);
    };
    applyTheme();
    document.addEventListener("theme:change", applyTheme);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      group.position.x = w > 900 ? 3.2 : 0;
      camera.position.z = w > 900 ? 15.5 : 21;
    };
    resize();
    addEventListener("resize", resize);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", (e) => { mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });

    const t0 = performance.now() + 250;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    let visible = true, raf = 0;
    const clock = new THREE.Clock();
    function loop() {
      raf = 0;
      if (!visible) return;
      const el = clock.getElapsedTime();
      uniforms.uTime.value = reduced ? 0 : el;
      if (!reduced) uniforms.uOrder.value = ease(Math.min(Math.max((performance.now() - t0) / 3200, 0), 1));
      lineMat.opacity = Math.max(0, uniforms.uOrder.value - 0.7) * 0.5;
      mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
      uniforms.uMouse.value.set(mouse.x, mouse.y);
      const sc = Math.min(scrollY / innerHeight, 1.2);
      group.rotation.y = 0.32 + mouse.x * 0.12 + (reduced ? 0 : Math.sin(el * 0.1) * 0.04);
      group.rotation.x = -0.42 - mouse.y * 0.07 + sc * 0.35;
      group.position.y = sc * 2.2;
      renderer.render(scene, camera);
      if (!reduced) raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) loop(); }).observe(canvas);
    loop();
  } catch (err) {
    console.warn("WebGL indisponível; hero segue sem o fundo 3D.", err);
    canvas.remove();
  }
}
