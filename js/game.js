/* =============================================================
   GAME — "Catch the falling stars".
   • No timer, no lives: missed stars simply fade away.
   • Adapts: if she's missing stars, they slow down.
   • Stars respond on pointerdown for instant feel; big hitboxes.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.game = (() => {
  const { $, fmt, rand, clamp, centerOf, animate, reducedMotion } = BQ.utils;
  const { data, state, ui, audio, particles } = BQ;
  const cfg = data.game;

  const field = $("#game-field");
  const scoreEl = $("#game-score");
  const introCard = $("#game-intro");
  const winCard = $("#game-win");

  let stars = [];
  let score = 0;
  let running = false;
  let raf = 0, spawnTimer = 0, lastT = 0;
  let speedFactor = 1;
  let shootingStarShown = false;

  function open() {
    stop();
    score = 0;
    shootingStarShown = false;
    speedFactor = 1;
    scoreEl.textContent = "0";
    introCard.hidden = false;
    winCard.hidden = true;
    ui.goScene("game").then(() => $("#btn-game-start").focus({ preventScroll: true }));
  }

  function start() {
    introCard.hidden = true;
    running = true;
    lastT = performance.now();
    audio.play("click");
    spawn();
    spawnTimer = setInterval(spawn, cfg.spawnEveryMs);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    clearInterval(spawnTimer);
    cancelAnimationFrame(raf);
    stars.forEach((s) => s.el.remove());
    stars = [];
  }

  function spawn(kind) {
    if (!running || document.hidden) return;
    if (!kind && stars.filter((s) => !s.caught).length >= 7) return;
    const W = field.clientWidth, H = field.clientHeight;
    const golden = kind !== "shooting" && Math.random() < cfg.goldenChance;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `fstar${golden ? " fstar--gold" : ""}${kind === "shooting" ? " fstar--shooting" : ""}`;
    el.setAttribute("aria-label", kind === "shooting" ? "Shooting star" : golden ? "Golden star" : "Star");
    el.innerHTML = BQ.art.fallingStar(golden || kind === "shooting");
    field.append(el);

    const baseSpeed = (55 + Math.random() * 45) * cfg.speed * (H / 700 + 0.4);
    const s = {
      el, golden, kind, caught: false,
      x: rand(W * 0.1, W * 0.9), y: -40,
      baseX: 0, vy: baseSpeed,
      vx: kind === "shooting" ? -W / 1.6 : 0,
      amp: kind === "shooting" ? 0 : rand(10, 34), phase: rand(0, 6.28), t: 0,
      rot: rand(-30, 30), vr: rand(-40, 40)
    };
    if (kind === "shooting") { s.x = W + 30; s.y = rand(H * 0.1, H * 0.3); s.vy = H / 5; }
    s.baseX = s.x;
    stars.push(s);

    const catchIt = (e) => { e.preventDefault(); catchStar(s); };
    el.addEventListener("pointerdown", catchIt);
    el.addEventListener("click", (e) => { if (e.detail === 0) catchStar(s); }); // keyboard
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    const H = field.clientHeight;
    for (const s of stars) {
      if (s.caught) continue;
      s.t += dt;
      s.y += s.vy * speedFactor * dt;
      s.baseX += s.vx * dt;
      s.x = s.baseX + (reducedMotion() ? 0 : Math.sin(s.phase + s.t * 1.4) * s.amp);
      s.rot += s.vr * dt;
      s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
      if (s.y > H + 50 || s.x < -60) miss(s);
    }
    stars = stars.filter((s) => s.el.isConnected);
    if (running) raf = requestAnimationFrame(loop);
  }

  function miss(s) {
    s.caught = true;
    s.el.remove();
    if (s.kind !== "shooting") speedFactor = clamp(speedFactor * 0.92, 0.55, 1.3); // gentler
  }

  function catchStar(s) {
    if (s.caught || !running) return;
    s.caught = true;
    const c = centerOf(s.el);
    if (s.kind === "shooting") {
      BQ.room.secret("shootingStar", s.el);
    } else {
      score = Math.min(cfg.target, score + (s.golden ? 2 : 1));
      scoreEl.textContent = String(score);
      scoreEl.parentElement.classList.remove("is-bump"); void scoreEl.offsetWidth; scoreEl.parentElement.classList.add("is-bump");
      speedFactor = clamp(speedFactor * 1.025, 0.55, 1.3);
      audio.play("sparkle", { volume: 0.5, pitch: score * 40 });
      particles.burst(c.x, c.y, { count: s.golden ? 30 : 16, speed: s.golden ? 6 : 4, colors: s.golden ? ["#F2C45A", "#FFE9A8", "#FFFFFF"] : undefined });
    }
    animate(s.el, [{ transform: s.el.style.transform, opacity: 1 }, { transform: `${s.el.style.transform} scale(1.8)`, opacity: 0 }], { duration: 300 })
      .finished.then(() => s.el.remove());

    if (!shootingStarShown && score >= Math.floor(cfg.target / 2) && !state.get().secrets.includes("shootingStar")) {
      shootingStarShown = true;
      setTimeout(() => spawn("shooting"), 900);
    }
    if (score >= cfg.target) win();
  }

  function win() {
    running = false;
    clearInterval(spawnTimer);
    stars.forEach((s) => { if (!s.caught) animate(s.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 }).finished.then(() => s.el.remove()); });
    audio.play("unlock");
    const r = field.getBoundingClientRect();
    particles.firework(r.left + r.width * 0.3, r.top + r.height * 0.35);
    setTimeout(() => particles.firework(r.left + r.width * 0.7, r.top + r.height * 0.3), 350);
    setTimeout(() => {
      winCard.hidden = false;
      animate(winCard, [{ opacity: 0, transform: "translate(-50%, -40%) scale(.9)" }, { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }], { duration: 600, easing: "cubic-bezier(.2,1.3,.4,1)" });
      winCard.querySelector("button").focus({ preventScroll: true });
    }, 900);
    if (!state.get().gameDone) {
      state.set("gameDone", true);
      BQ.main.pendingStarFrom = "window";
    }
  }

  function init() {
    $("#game-title").textContent = fmt(cfg.title);
    $("#game-text").textContent = fmt(cfg.instructions);
    $("#game-target").textContent = String(cfg.target);
    $("#game-win-title").textContent = fmt(cfg.winTitle);
    $("#game-win-text").textContent = fmt(cfg.winText);
    $("#btn-game-start").addEventListener("click", start);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && running) lastT = performance.now(); });
  }

  return { init, open, stop };
})();
