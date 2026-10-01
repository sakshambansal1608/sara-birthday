/* =============================================================
   PARTICLES — one shared canvas for sparkles, hearts, stars and
   fireworks. The loop only runs while particles are alive and
   pauses when the tab is hidden.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.particles = (() => {
  const { rand, reducedMotion } = BQ.utils;
  const PALETTE = ["#F2D27A", "#F4B69C", "#B9ADE3", "#FFFFFF", "#8E9BE0", "#EFA7B5"];

  let canvas, ctx, dpr = 1, w = 0, h = 0;
  let parts = [];
  let running = false;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4;

  function init() {
    canvas = document.getElementById("fx-canvas");
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Scale particle counts for device + motion preference. */
  const scale = (n) => Math.max(1, Math.round(n * (reducedMotion() ? 0.25 : lowPower ? 0.6 : 1)));

  function add(p) {
    parts.push({ life: 1, decay: 0.012, vx: 0, vy: 0, gravity: 0, drag: 0.98, rot: 0, vr: 0, size: 4, shape: "spark", color: "#fff", ...p });
    kick();
  }

  /** Burst of sparkles at a point. */
  function burst(x, y, { count = 24, colors = PALETTE, shape = "spark", speed = 5, gravity = 0.08, size = [2, 5] } = {}) {
    const n = scale(count);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(speed * 0.3, speed);
      add({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25,
        gravity, shape,
        size: rand(size[0], size[1]),
        color: colors[(Math.random() * colors.length) | 0],
        decay: rand(0.012, 0.024),
        vr: rand(-0.2, 0.2)
      });
    }
  }

  /** One soft firework: a rising trail then a burst. */
  function firework(x, y) {
    if (reducedMotion()) return burst(x, y, { count: 10, speed: 2 });
    const startY = h + 10;
    add({ x, y: startY, vx: rand(-0.4, 0.4), vy: -((startY - y) / 38), gravity: 0, drag: 0.985, size: 2.2, color: "#FFE9B0", decay: 0.022, shape: "dot", onDeath: (p) => burst(p.x, p.y, { count: 46, speed: 4.2, gravity: 0.045, size: [1.5, 3.5] }) });
  }

  /** Hearts floating gently upwards. */
  function hearts(count = 10) {
    const n = scale(count);
    for (let i = 0; i < n; i++) {
      setTimeout(() => add({
        x: rand(w * 0.1, w * 0.9), y: h + 20,
        vx: rand(-0.3, 0.3), vy: rand(-1.4, -0.8),
        drag: 1, gravity: 0, decay: rand(0.003, 0.005),
        size: rand(9, 15), shape: "heart", vr: rand(-0.01, 0.01),
        color: ["#EFA7B5", "#F4B69C", "#F7C6CF"][i % 3], sway: rand(0, 6)
      }), i * 280);
    }
  }

  /** Stars that bloom across the screen (used for the wish). */
  function starBloom(count = 60) {
    const n = scale(count);
    for (let i = 0; i < n; i++) {
      setTimeout(() => add({
        x: rand(0, w), y: rand(0, h * 0.75),
        size: rand(1.5, 4), shape: "star", color: i % 5 ? "#FFFFFF" : "#F2D27A",
        decay: rand(0.006, 0.01), drag: 1, twinkle: rand(0, 6), grow: true
      }), rand(0, 900));
    }
  }

  function drawStar(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 16, s / 16);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-8, -1, -7, -9, 0, -5);
    ctx.bezierCurveTo(7, -9, 8, -1, 0, 5);
    ctx.fill();
    ctx.restore();
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    const next = [];
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx + (p.sway ? Math.sin(t / 700 + p.sway) * 0.4 : 0);
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0) { if (p.onDeath) p.onDeath(p); continue; }
      let alpha = Math.min(1, p.life * 1.6);
      if (p.twinkle !== undefined) alpha *= 0.6 + 0.4 * Math.sin(t / 180 + p.twinkle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const size = p.grow ? p.size * Math.min(1, (1 - p.life) * 6) : p.size;
      if (p.shape === "heart") drawHeart(p.x, p.y, size, p.rot);
      else if (p.shape === "star") drawStar(p.x, p.y, size * 1.6, p.rot);
      else if (p.shape === "dot") { ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill(); }
      else { // spark: little four-point glint
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-size / 2, -size * 0.12, size, size * 0.24);
        ctx.fillRect(-size * 0.12, -size / 2, size * 0.24, size);
        ctx.restore();
      }
      next.push(p);
    }
    ctx.globalAlpha = 1;
    parts = next;
    if (parts.length && !document.hidden) requestAnimationFrame(frame);
    else { running = false; if (!parts.length) ctx.clearRect(0, 0, w, h); }
  }

  function kick() {
    if (running || !parts.length) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function clear() { parts = []; }

  return { init, burst, firework, hearts, starBloom, clear };
})();
