/* Small shared helpers used by every module. */
window.BQ = window.BQ || {};

BQ.utils = (() => {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Replace {name} / {from} tokens with values from data.js */
  const fmt = (text = "") =>
    String(text)
      .replaceAll("{name}", BQ.data.name)
      .replaceAll("{from}", BQ.data.fromName);

  /** Promise-based pause. Pass a skip-token to allow early exit. */
  const sleep = (ms, token) =>
    new Promise((resolve) => {
      if (token && token.skipped) return resolve();
      const id = setTimeout(resolve, ms);
      if (token) token.onSkip = () => { clearTimeout(id); resolve(); };
    });

  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const reducedMotion = () => reducedQuery.matches;

  /** Web Animations API wrapper that respects reduced motion. */
  function animate(el, keyframes, options = {}) {
    if (!el || !el.animate) return { finished: Promise.resolve(), cancel() {} };
    const opts = { easing: "cubic-bezier(.22,1,.36,1)", fill: "both", ...options };
    if (reducedMotion()) {
      // Keep only opacity changes; skip movement.
      const frames = keyframes.map((f) => ("opacity" in f ? { opacity: f.opacity } : {}));
      opts.duration = Math.min(opts.duration || 300, 250);
      return el.animate(frames, opts);
    }
    return el.animate(keyframes, opts);
  }

  /** Centre of an element in viewport coordinates. */
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
  }

  /** Create an element from an HTML string. */
  function html(str) {
    const t = document.createElement("template");
    t.innerHTML = str.trim();
    return t.content.firstElementChild;
  }

  /** Escape text before inserting into HTML strings. */
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /** Long-press helper. Returns a function that removes listeners. */
  function onLongPress(el, ms, callback) {
    let timer = null;
    const start = (e) => {
      if (e.button && e.button !== 0) return;
      timer = setTimeout(() => { timer = null; el.dataset.longPressed = "1"; callback(e); }, ms);
    };
    const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
    el.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((t) => el.addEventListener(t, cancel));
    // Swallow the click that follows a long press.
    el.addEventListener("click", (e) => {
      if (el.dataset.longPressed) { e.stopImmediatePropagation(); e.preventDefault(); delete el.dataset.longPressed; }
    }, true);
  }

  return { $, $$, fmt, sleep, rand, clamp, reducedMotion, animate, centerOf, html, esc, onLongPress };
})();
