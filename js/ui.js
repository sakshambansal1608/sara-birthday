/* =============================================================
   UI — reusable building blocks:
   scenes · panel (sheets/cards) · toasts · tooltip ·
   constellation · flying star · video player
   ============================================================= */
window.BQ = window.BQ || {};

BQ.ui = (() => {
  const { $, $$, animate, centerOf, esc, fmt, reducedMotion } = BQ.utils;

  /* ---------------------------------------------------------
     SCENES
     --------------------------------------------------------- */
  const sceneEls = {
    intro: $("#intro"), room: $("#room"), game: $("#game"), final: $("#final")
  };
  let currentScene = "intro";
  const sceneHooks = {};

  function onScene(name, fn) { (sceneHooks[name] = sceneHooks[name] || []).push(fn); }

  async function goScene(name) {
    if (name === currentScene) return;
    const from = sceneEls[currentScene];
    const to = sceneEls[name];
    hideTooltip();
    if (!panel.el.hidden) closePanel(true);
    const out = animate(from, [
      { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
      { opacity: 0, filter: "blur(10px)", transform: "scale(1.04)" }
    ], { duration: 500, easing: "ease-in" });
    await out.finished;
    from.hidden = true;
    out.cancel();
    currentScene = name;
    document.body.dataset.scene = name;
    $("#hud").hidden = name !== "room";
    to.hidden = false;
    animate(to, [
      { opacity: 0, filter: "blur(10px)", transform: "scale(.97)" },
      { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }
    ], { duration: 700 }).finished.then((a) => a && a.cancel && a.cancel());
    (sceneHooks[name] || []).forEach((fn) => fn());
  }

  /* ---------------------------------------------------------
     PANEL — every sub-experience opens here. Flies out of the
     object that opened it, and back into it on close.
     --------------------------------------------------------- */
  const panel = {
    el: $("#panel"),
    sheet: $(".panel__sheet"),
    body: $("#panel-body"),
    backdrop: $(".panel__backdrop"),
    origin: null,
    onClose: null,
    lastFocus: null,
    id: null
  };

  /** Swap [data-art] placeholders for SVG drawings. */
  function injectArt(root) {
    $$("[data-art]", root).forEach((el) => {
      const fn = BQ.art[el.dataset.art];
      if (fn && !el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", fn());
    });
  }

  function flyVector(originEl) {
    if (!originEl) return { dx: 0, dy: 60 };
    const o = centerOf(originEl);
    const s = centerOf(panel.sheet);
    return { dx: o.x - s.x, dy: o.y - s.y };
  }

  function openPanel(id, { origin = null, fill = null, onClose = null, variant = "" } = {}) {
    const tpl = $(`#tpl-${id}`);
    if (!tpl) return;
    panel.lastFocus = document.activeElement;
    panel.origin = origin;
    panel.onClose = onClose;
    panel.id = id;
    panel.body.innerHTML = "";
    panel.body.append(tpl.content.cloneNode(true));
    panel.sheet.className = `panel__sheet ${variant ? `panel__sheet--${variant}` : ""}`;
    panel.sheet.dataset.panel = id;
    injectArt(panel.body);
    if (fill) fill(panel.body);
    panel.el.hidden = false;
    document.body.classList.add("has-panel");
    hideTooltip();

    const { dx, dy } = flyVector(origin);
    animate(panel.backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
    animate(panel.sheet, [
      { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(.35)` },
      { opacity: 1, transform: "translate(0,0) scale(1)" }
    ], { duration: 560, easing: "cubic-bezier(.2,1.2,.35,1)" }).finished.then(() => {
      panel.sheet.getAnimations().forEach((a) => a.cancel());
    });
    panel.body.scrollTop = 0;
    requestAnimationFrame(() => $(".btn-back", panel.sheet).focus({ preventScroll: true }));
  }

  async function closePanel(instant = false) {
    if (panel.el.hidden) return;
    // Stop any media inside the panel.
    $$("video", panel.body).forEach((v) => v.pause());
    if (!instant) {
      const { dx, dy } = flyVector(panel.origin);
      animate(panel.backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      await animate(panel.sheet, [
        { opacity: 1, transform: getComputedStyle(panel.sheet).transform === "none" ? "translate(0,0) scale(1)" : getComputedStyle(panel.sheet).transform },
        { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(.3)` }
      ], { duration: 380, easing: "cubic-bezier(.55,0,.8,.4)" }).finished;
    }
    panel.el.hidden = true;
    panel.sheet.style.transform = "";
    panel.sheet.getAnimations().forEach((a) => a.cancel());
    panel.backdrop.getAnimations().forEach((a) => a.cancel());
    panel.body.innerHTML = "";
    document.body.classList.remove("has-panel");
    const cb = panel.onClose;
    panel.onClose = null;
    panel.id = null;
    if (panel.lastFocus && panel.lastFocus.isConnected) panel.lastFocus.focus({ preventScroll: true });
    if (cb) cb();
  }

  function initPanel() {
    panel.el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closePanel(); });

    // Keyboard: Esc closes, Tab stays inside the sheet.
    document.addEventListener("keydown", (e) => {
      if (panel.el.hidden || !$("#viewer").hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closePanel(); }
      if (e.key === "Tab") {
        const f = $$('button, [href], input, video[controls], [tabindex]:not([tabindex="-1"])', panel.sheet).filter((el) => !el.disabled && el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe down on the grip/header to close (phones).
    let startY = null, lastY = 0, startT = 0;
    const handle = (e) => e.target.closest(".panel__grip, .panel__bar") && !e.target.closest("button");
    panel.sheet.addEventListener("pointerdown", (e) => {
      if (!handle(e) || e.pointerType === "mouse") return;
      startY = e.clientY; lastY = 0; startT = performance.now();
      panel.sheet.setPointerCapture(e.pointerId);
    });
    panel.sheet.addEventListener("pointermove", (e) => {
      if (startY === null) return;
      lastY = Math.max(0, e.clientY - startY);
      panel.sheet.style.transform = `translateY(${lastY}px)`;
    });
    const end = () => {
      if (startY === null) return;
      const fast = lastY / (performance.now() - startT) > 0.6;
      startY = null;
      if (lastY > 110 || (fast && lastY > 40)) closePanel();
      else {
        animate(panel.sheet, [{ transform: `translateY(${lastY}px)` }, { transform: "translateY(0)" }], { duration: 300 })
          .finished.then(() => { panel.sheet.style.transform = ""; panel.sheet.getAnimations().forEach((a) => a.cancel()); });
      }
    };
    panel.sheet.addEventListener("pointerup", end);
    panel.sheet.addEventListener("pointercancel", end);
  }

  /* ---------------------------------------------------------
     TOASTS
     --------------------------------------------------------- */
  function toast({ title, text = "", icon = "✦", duration = 6000 }) {
    const el = BQ.utils.html(`
      <button class="toast" type="button" aria-label="Dismiss">
        <span class="toast__icon" aria-hidden="true">${esc(icon)}</span>
        <span class="toast__text"><strong>${esc(fmt(title))}</strong>${text ? `<span>${esc(fmt(text))}</span>` : ""}</span>
      </button>`);
    $("#toasts").append(el);
    animate(el, [{ opacity: 0, transform: "translateY(-14px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 420 });
    const remove = async () => {
      if (!el.isConnected) return;
      await animate(el, [{ opacity: 1 }, { opacity: 0, transform: "translateY(-10px)" }], { duration: 260 }).finished;
      el.remove();
    };
    el.addEventListener("click", remove);
    setTimeout(remove, duration);
  }

  /* ---------------------------------------------------------
     TOOLTIP
     --------------------------------------------------------- */
  const tip = $("#tooltip");
  function showTooltip(target, text) {
    if (!text) return;
    tip.textContent = text;
    tip.hidden = false;
    const art = target.querySelector("svg") || target;
    const r = art.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const x = Math.min(window.innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2));
    const y = Math.max(70, r.top + r.height * 0.18 - tip.offsetHeight - 6);
    tip.style.setProperty("--x", `${x}px`);
    tip.style.setProperty("--y", `${y}px`);
    tip.classList.add("is-visible");
  }
  function hideTooltip() { tip.classList.remove("is-visible"); tip.hidden = true; }

  /* ---------------------------------------------------------
     CONSTELLATION — the progress indicator.
     --------------------------------------------------------- */
  const STAR_POS = [[10, 42], [25, 20], [43, 32], [60, 12], [77, 28], [91, 48]];

  function renderConstellation(svg, lit, { large = false } = {}) {
    // Already built? Only toggle classes so lit stars don't re-animate.
    const existing = svg.querySelectorAll(".c-star");
    if (existing.length === STAR_POS.length) {
      existing.forEach((el, i) => el.classList.toggle("is-lit", i < lit));
      svg.querySelectorAll(".c-line").forEach((el, i) => el.classList.toggle("is-lit", i + 1 < lit));
      return;
    }
    const r = large ? 2.6 : 4.2;
    const lines = STAR_POS.slice(1).map(([x, y], i) => {
      const [px, py] = STAR_POS[i];
      const on = i + 1 < lit;
      return `<line class="c-line ${on ? "is-lit" : ""}" x1="${px}" y1="${py}" x2="${x}" y2="${y}" pathLength="1"/>`;
    }).join("");
    const stars = STAR_POS.map(([x, y], i) =>
      `<polygon class="c-star ${i < lit ? "is-lit" : ""}" data-i="${i}" points="${BQ.art.starPoints(x, y, r)}"/>`).join("");
    svg.innerHTML = lines + stars;
  }

  /** A star flies from an object to its place in the HUD. */
  function flyStar(fromEl, index, onDone) {
    const target = $(`#hud-constellation .c-star[data-i="${index}"]`);
    if (!fromEl || !target || reducedMotion()) { onDone && onDone(); return; }
    const a = centerOf(fromEl), b = centerOf(target);
    const star = BQ.utils.html(`<span class="fly-star" aria-hidden="true">${BQ.art.fallingStar(true)}</span>`);
    document.body.append(star);
    const midX = (a.x + b.x) / 2 + 40, midY = Math.min(a.y, b.y) - 80;
    star.animate([
      { transform: `translate(${a.x}px, ${a.y}px) scale(.4) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${a.x}px, ${a.y - 30}px) scale(1.3) rotate(40deg)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${midX}px, ${midY}px) scale(1) rotate(160deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${b.x}px, ${b.y}px) scale(.5) rotate(300deg)`, opacity: 1 }
    ], { duration: 1100, easing: "cubic-bezier(.45,0,.2,1)", fill: "forwards" }).finished.then(() => {
      star.remove();
      onDone && onDone();
    });
  }

  /* ---------------------------------------------------------
     VIDEO PLAYER — used by the gift and the final room.
     Custom "press play" cover, native controls once playing,
     automatic aspect ratio (works for vertical phone videos),
     graceful fallback to a photo or a placeholder card.
     --------------------------------------------------------- */
  /** Size the player to the media's real shape (vertical videos welcome). */
  function setRatio(wrap, w, h) {
    wrap.style.setProperty("--ar", `${w} / ${h}`);
    wrap.style.setProperty("--arnum", (w / h).toFixed(4));
  }

  function videoPlayer(container, { src, poster = "", fallbackPhoto = "", fallbackAlt = "", title = "Play video" }) {
    container.innerHTML = `
      <div class="vplayer">
        <video playsinline preload="metadata"></video>
        <button class="vplayer__play" type="button">
          <span class="vplayer__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
          <span class="vplayer__label">${esc(fmt(title))}</span>
        </button>
        <div class="vplayer__empty" hidden>
          <span aria-hidden="true">🎬</span>
          <p>Your video goes here</p>
          <small>Add the file at ${esc(src)}</small>
        </div>
      </div>`;
    const wrap = $(".vplayer", container);
    const v = $("video", wrap);
    const btn = $(".vplayer__play", wrap);
    const empty = $(".vplayer__empty", wrap);

    if (poster) {
      const probe = new Image();
      probe.onload = () => { v.poster = poster; };
      probe.src = poster;
    }

    const showFallback = () => {
      btn.hidden = true;
      v.remove();
      if (fallbackPhoto) {
        const img = new Image();
        img.alt = fmt(fallbackAlt);
        img.className = "vplayer__photo";
        img.onload = () => { wrap.classList.add("is-photo"); setRatio(wrap, img.naturalWidth, img.naturalHeight); };
        img.onerror = () => { img.remove(); empty.hidden = false; wrap.classList.add("is-empty"); };
        img.src = fallbackPhoto;
        wrap.append(img);
      } else {
        empty.hidden = false;
        wrap.classList.add("is-empty");
      }
    };

    if (!src) showFallback();
    else {
      v.addEventListener("error", showFallback, { once: true });
      v.addEventListener("loadedmetadata", () => {
        if (v.videoWidth && v.videoHeight) setRatio(wrap, v.videoWidth, v.videoHeight);
        wrap.classList.add("is-ready");
      });
      v.src = src;
    }

    btn.addEventListener("click", () => {
      BQ.audio.pauseMusic();
      v.muted = false;
      v.dataset.userVolume = "1";
      v.controls = true;
      btn.hidden = true;
      wrap.classList.add("is-playing");
      v.play().catch(() => { btn.hidden = false; });
    });
    v.addEventListener("ended", () => {
      v.controls = false;
      btn.hidden = false;
      $(".vplayer__label", btn).textContent = "Watch again";
      wrap.classList.remove("is-playing");
    });

    return { wrap, video: v };
  }

  return {
    goScene, onScene, get scene() { return currentScene; },
    openPanel, closePanel, injectArt, initPanel, get panelId() { return panel.id; },
    toast, showTooltip, hideTooltip,
    renderConstellation, flyStar, STAR_POS,
    videoPlayer
  };
})();
