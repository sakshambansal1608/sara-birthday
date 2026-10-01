/* =============================================================
   FINAL ROOM — the emotional climax.
   Dark → stars appear → her constellation connects →
   "Okay…" → "One last thing." → message + video → celebration.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.final = (() => {
  const { $, fmt, esc, sleep, rand, animate, reducedMotion } = BQ.utils;
  const { data, state, ui, audio, particles } = BQ;
  const d = data.final;

  const scene = $("#final");
  const lineEl = $("#final-line");
  const content = $("#final-content");
  const constel = $("#final-constellation");
  let token = { skipped: false };
  let revealed = false;

  /* ---------- Night sky canvas ---------- */
  const sky = { canvas: $("#final-sky"), ctx: null, stars: [], raf: 0, start: 0 };

  function startSky() {
    const c = sky.canvas;
    sky.ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    sky.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((w * h) / (reducedMotion() ? 9000 : 5200));
    sky.stars = Array.from({ length: count }, () => ({
      x: rand(0, w), y: rand(0, h), r: rand(0.4, 1.6),
      delay: rand(0, 4000), tw: rand(0, 6), speed: rand(600, 1400)
    }));
    sky.start = performance.now();
    cancelAnimationFrame(sky.raf);
    const draw = (t) => {
      const ctx = sky.ctx;
      ctx.clearRect(0, 0, w, h);
      const el = t - sky.start;
      for (const s of sky.stars) {
        const appear = Math.min(1, Math.max(0, (el - s.delay) / 1500));
        if (!appear) continue;
        const tw = reducedMotion() ? 1 : 0.55 + 0.45 * Math.sin(t / s.speed + s.tw);
        ctx.globalAlpha = appear * tw;
        ctx.fillStyle = "#FFF6E0";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!scene.hidden && !document.hidden) sky.raf = requestAnimationFrame(draw);
    };
    sky.raf = requestAnimationFrame(draw);
  }

  /* ---------- Sequence ---------- */
  async function showLine(text) {
    lineEl.textContent = fmt(text);
    await animate(lineEl, [{ opacity: 0, filter: "blur(8px)", transform: "translateY(10px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 1100 }).finished;
    await sleep(1500, token);
    await animate(lineEl, [{ opacity: 1 }, { opacity: 0, filter: "blur(8px)" }], { duration: 700 }).finished;
  }

  async function play() {
    token = { skipped: false };
    revealed = false;
    content.hidden = true;
    lineEl.textContent = "";
    $("#btn-final-skip").hidden = false;
    constel.classList.remove("is-connected", "is-up");
    ui.renderConstellation(constel, 0, { large: true });
    audio.play("unlock", { volume: 0.4 });

    await ui.goScene("final");
    startSky();
    await sleep(1600, token);

    // Her stars appear one by one, then connect.
    for (let i = 1; i <= 6 && !token.skipped; i++) {
      ui.renderConstellation(constel, i, { large: true });
      audio.play("sparkle", { volume: 0.3, pitch: i * 120 });
      await sleep(320, token);
    }
    ui.renderConstellation(constel, 6, { large: true });
    await sleep(80);
    constel.classList.add("is-connected");
    await sleep(1800, token);

    for (const text of d.lines) {
      if (token.skipped) break;
      await showLine(text);
    }
    reveal();
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    $("#btn-final-skip").hidden = true;
    lineEl.textContent = "";
    lineEl.getAnimations().forEach((a) => a.cancel());
    ui.renderConstellation(constel, 6, { large: true });
    constel.classList.add("is-connected", "is-up");

    $("#final-heading").textContent = fmt(d.heading);
    $("#final-message").innerHTML = d.message.map((p) => `<p>${esc(fmt(p))}</p>`).join("");
    $("#final-sign").textContent = fmt(d.signoff);
    ui.videoPlayer($("#final-media"), {
      src: d.video, poster: d.poster, fallbackPhoto: d.photo, fallbackAlt: d.photoAlt, title: d.videoTitle
    });

    content.hidden = false;
    $(".final__stage").scrollTop = 0;
    const parts = Array.from(content.children);
    parts.forEach((el, i) => animate(el, [
      { opacity: 0, transform: "translateY(24px)", filter: "blur(6px)" },
      { opacity: 1, transform: "none", filter: "blur(0)" }
    ], { duration: 900, delay: 200 + i * 450 }));

    setTimeout(celebrate, 900);
    state.set("finaleSeen", true);
    BQ.room.refresh();
  }

  function celebrate() {
    if (scene.hidden) return;
    audio.play("celebration", { volume: 0.5 });
    const w = window.innerWidth, h = window.innerHeight;
    const shots = reducedMotion() ? 1 : 5;
    for (let i = 0; i < shots; i++) {
      setTimeout(() => { if (!scene.hidden) particles.firework(rand(w * 0.15, w * 0.85), rand(h * 0.12, h * 0.4)); }, i * 650);
    }
    setTimeout(() => { if (!scene.hidden) particles.hearts(12); }, 1200);
  }

  function skip() {
    token.skipped = true;
    if (token.onSkip) token.onSkip();
    reveal();
  }

  function init() {
    $("#btn-final-skip").addEventListener("click", skip);
    $("#btn-final-replay").addEventListener("click", () => {
      scene.querySelectorAll("video").forEach((v) => v.pause());
      particles.clear();
      replayInPlace();
    });
  }

  /** Replay without leaving the scene. */
  async function replayInPlace() {
    content.hidden = true;
    revealed = false;
    token = { skipped: false };
    $("#btn-final-skip").hidden = false;
    constel.classList.remove("is-connected", "is-up");
    ui.renderConstellation(constel, 0, { large: true });
    startSky();
    await sleep(900, token);
    for (let i = 1; i <= 6 && !token.skipped; i++) { ui.renderConstellation(constel, i, { large: true }); await sleep(260, token); }
    constel.classList.add("is-connected");
    await sleep(1500, token);
    for (const text of d.lines) { if (token.skipped) break; await showLine(text); }
    reveal();
  }

  return { init, play };
})();
