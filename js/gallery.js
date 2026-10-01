/* =============================================================
   GALLERY — scattered polaroids + a viewer that lifts the photo
   to the centre (FLIP animation), with swipe, arrows and keys.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.gallery = (() => {
  const { $, esc, fmt, animate } = BQ.utils;
  const photos = BQ.data.photos;
  const TILTS = [-4, 3, -2, 5, -3, 2, -5, 4];

  const viewer = $("#viewer");
  const card = $("#viewer-card");
  const img = $("#viewer-img");
  let index = 0;
  let sourceCards = [];
  let lastFocus = null;

  /** Placeholder shown when a photo file is missing. */
  function markMissing(imgEl, i) {
    const box = imgEl.parentElement;
    box.classList.add("is-missing");
    box.dataset.label = `Add photo${i + 1}.jpg`;
    imgEl.remove();
  }

  function buildBoard(board) {
    board.innerHTML = photos.map((p, i) => `
      <button class="polaroid" type="button" data-i="${i}" style="--tilt:${TILTS[i % TILTS.length]}deg" aria-label="Open photo: ${esc(fmt(p.caption))}">
        <span class="polaroid__tape" aria-hidden="true"></span>
        <span class="polaroid__img"><img src="${esc(p.src)}" alt="${esc(fmt(p.alt))}" loading="lazy" decoding="async"></span>
        <span class="polaroid__caption">${esc(fmt(p.caption))}</span>
      </button>`).join("");
    sourceCards = Array.from(board.querySelectorAll(".polaroid"));
    sourceCards.forEach((c, i) => {
      const im = c.querySelector("img");
      im.addEventListener("error", () => markMissing(im, i), { once: true });
      c.addEventListener("click", () => open(i));
    });
  }

  function render() {
    const p = photos[index];
    const box = img.parentElement;
    box.classList.remove("is-missing");
    if (!box.contains(img)) box.append(img);
    img.onerror = () => { box.classList.add("is-missing"); box.dataset.label = `Add photo${index + 1}.jpg`; img.remove(); };
    img.src = p.src;
    img.alt = fmt(p.alt);
    $("#viewer-caption").textContent = fmt(p.caption);
    $("#viewer-date").textContent = fmt(p.date || "");
    $("#viewer-count").textContent = `${index + 1} of ${photos.length}`;
  }

  function open(i) {
    index = i;
    lastFocus = document.activeElement;
    render();
    viewer.hidden = false;
    BQ.audio.play("click");
    // FLIP: start from the clicked polaroid's position.
    const from = sourceCards[i].getBoundingClientRect();
    const to = card.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s = from.width / to.width;
    animate($(".viewer__backdrop"), [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
    animate(card, [
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(${TILTS[i % TILTS.length]}deg)` },
      { transform: "translate(0,0) scale(1) rotate(-1deg)" }
    ], { duration: 620, easing: "cubic-bezier(.2,1.15,.35,1)" });
    $("#viewer-next").focus({ preventScroll: true });
  }

  async function close() {
    if (viewer.hidden) return;
    const target = sourceCards[index];
    if (target && target.isConnected) {
      const from = card.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      animate($(".viewer__backdrop"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      await animate(card, [
        { transform: "translate(0,0) scale(1) rotate(-1deg)" },
        { transform: `translate(${dx}px, ${dy}px) scale(${to.width / from.width}) rotate(${TILTS[index % TILTS.length]}deg)`, opacity: 0.4 }
      ], { duration: 380, easing: "cubic-bezier(.5,0,.75,.2)" }).finished;
    }
    viewer.hidden = true;
    card.getAnimations().forEach((a) => a.cancel());
    $(".viewer__backdrop").getAnimations().forEach((a) => a.cancel());
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  async function step(dir) {
    const next = (index + dir + photos.length) % photos.length;
    BQ.audio.play("click", { volume: 0.4 });
    await animate(card, [{ opacity: 1, transform: "rotate(-1deg)" }, { opacity: 0, transform: `translateX(${-dir * 60}px) rotate(${-dir * 6}deg)` }], { duration: 200, easing: "ease-in" }).finished;
    index = next;
    render();
    animate(card, [{ opacity: 0, transform: `translateX(${dir * 60}px) rotate(${dir * 6}deg)` }, { opacity: 1, transform: "rotate(-1deg)" }], { duration: 360 });
  }

  function init() {
    viewer.addEventListener("click", (e) => { if (e.target.closest("[data-viewer-close]")) close(); });
    $("#viewer-prev").addEventListener("click", () => step(-1));
    $("#viewer-next").addEventListener("click", () => step(1));

    document.addEventListener("keydown", (e) => {
      if (viewer.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") { // keep focus inside the viewer
        const f = Array.from(viewer.querySelectorAll("button"));
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    }, true);

    // Swipe left/right on the photo.
    let sx = null, sy = 0;
    card.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    card.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 90) close();
    });
  }

  return { init, buildBoard };
})();
