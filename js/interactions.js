/* =============================================================
   INTERACTIONS — everything that happens in the room:
   objects, locks, hints from the bunny, and each object's panel.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.room = (() => {
  const { $, $$, fmt, esc, sleep, rand, animate, centerOf, onLongPress } = BQ.utils;
  const { data, state, ui, audio, particles } = BQ;

  const objs = {};
  const bubble = $(".plush-bubble");
  let idleTimer = null;
  let plushTaps = 0, plushTapTimer = null;
  let bubbleTimer = null;

  /* ---------------------------------------------------------
     STEPS — what she should do next (used by hints & journey)
     --------------------------------------------------------- */
  const STEPS = [
    { id: "envelope", label: "Read the letter", done: () => state.has("envelope"), hint: "Start with the letter on the desk 💌" },
    { id: "cake", label: "Make a wish", done: () => state.has("cake"), hint: "The cake is waiting for a wish 🎂" },
    { id: "photos", label: "Open the scrapbook", done: () => state.has("photos"), hint: "Have a look at the photo frame 📸" },
    { id: "music", label: "Play your song", done: () => state.has("music"), hint: "Put the headphones on and press play 🎧" },
    { id: "notes", label: "Unfold a note from the jar", done: () => state.has("notes"), hint: "The jar is full of little notes about you" },
    { id: "gift", label: "Open your gift", done: () => state.get().giftOpen, hint: "Your gift just unlocked. Go open it 🎁" },
    { id: "window", label: "Catch the falling stars", done: () => state.get().gameDone, hint: "Stars are falling outside the window ⭐" },
    { id: "mystery", label: "Open the last door", done: () => state.get().finaleSeen, hint: "The mystery box is glowing. It's time 🔐" }
  ];

  function nextStep() {
    const core = STEPS.slice(0, 5).find((s) => !s.done());
    if (core) return core;
    return STEPS.slice(5).find((s) => !s.done()) || null;
  }

  /* ---------------------------------------------------------
     LOCKS
     --------------------------------------------------------- */
  function lockInfo(id) {
    const s = state.get();
    if (id === "gift" && !state.coreDone()) {
      const left = state.CORE.length - state.coreCount();
      return `Locked. Discover ${left} more ${left === 1 ? "thing" : "things"} to open me`;
    }
    if (id === "window" && !s.giftOpen) return "Locked. Open your gift first";
    if (id === "mystery" && !s.gameDone) return "Locked. Something needs to happen outside first";
    return null;
  }

  const TIPS = {
    envelope: "A letter for you", cake: "Make a wish", photos: "Something is waiting here…",
    music: "Put these on", notes: "Little notes about you", gift: "Your gift",
    window: "Look outside", plushie: "Need a hint?", mystery: "One last thing"
  };

  function refresh() {
    const s = state.get();
    Object.entries(objs).forEach(([id, el]) => {
      const locked = !!lockInfo(id);
      el.classList.toggle("is-locked", locked);
      el.classList.toggle("is-found", state.has(id) || (id === "gift" && s.giftOpen) || (id === "window" && s.gameDone));
      const badge = el.querySelector(".obj__badge");
      if (badge) badge.textContent = locked ? "🔒" : el.classList.contains("is-found") ? "★" : "";
      badge && (badge.hidden = !badge.textContent);
    });
    const room = $("#room");
    room.classList.toggle("is-wished", s.wished);
    room.classList.toggle("is-gift-open", s.giftOpen);
    room.classList.toggle("is-final-ready", s.gameDone);
    room.classList.toggle("is-complete", s.finaleSeen);
  }

  /* ---------------------------------------------------------
     HINTS — the bunny speaks after 12s idle, or when tapped.
     --------------------------------------------------------- */
  function say(text, ms = 4200) {
    clearTimeout(bubbleTimer);
    bubble.textContent = fmt(text);
    bubble.hidden = false;
    positionBubble();
    bubble.classList.remove("is-in");
    void bubble.offsetWidth;
    bubble.classList.add("is-in");
    bubbleTimer = setTimeout(() => { bubble.classList.remove("is-in"); bubble.hidden = true; }, ms);
  }

  function positionBubble() {
    const art = objs.plushie.querySelector("svg");
    const r = art.getBoundingClientRect();
    // Narrow screens: sit beside the bunny in the empty floor space,
    // so the hint never covers the objects it's pointing at.
    let sideRoom = window.innerWidth - r.right - 4;
    const m = objs.mystery.querySelector("svg").getBoundingClientRect();
    if (m.top < r.bottom && m.bottom > r.top) sideRoom = Math.min(sideRoom, m.left + m.width * 0.2 - r.right);
    const side = window.innerWidth < 640 && sideRoom > 150;
    bubble.classList.toggle("is-side", side);
    if (side) {
      bubble.style.setProperty("--max", `${Math.min(260, sideRoom - 8)}px`);
      bubble.style.setProperty("--x", `${r.right - 14}px`);
      bubble.style.setProperty("--y", `${r.top + r.height * 0.18}px`);
      return;
    }
    bubble.style.removeProperty("--max");
    const bw = bubble.offsetWidth;
    const x = Math.min(window.innerWidth - bw - 12, Math.max(12, r.left + r.width * 0.5 - 24));
    bubble.style.setProperty("--x", `${x}px`);
    bubble.style.setProperty("--y", `${r.top + r.height * 0.1 - bubble.offsetHeight - 8}px`);
  }

  function highlightNext() {
    $$(".obj.is-next").forEach((el) => el.classList.remove("is-next"));
    const step = nextStep();
    if (step && objs[step.id]) objs[step.id].classList.add("is-next");
    return step;
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    $$(".obj.is-next").forEach((el) => el.classList.remove("is-next"));
    idleTimer = setTimeout(() => {
      if (ui.scene !== "room" || ui.panelId) return resetIdle();
      const step = highlightNext();
      if (step) say(step.hint, 5200);
    }, 12000);
  }

  /* ---------------------------------------------------------
     SECRETS
     --------------------------------------------------------- */
  function secret(id, originEl) {
    if (!state.addSecret(id)) return;
    const s = data.secrets[id];
    audio.play("sparkle", { pitch: 300 });
    if (originEl) { const c = centerOf(originEl); particles.burst(c.x, c.y, { count: 26, shape: "star", speed: 4 }); }
    ui.toast({ title: s.title, text: s.text, icon: "👀", duration: 8000 });
  }

  /* ---------------------------------------------------------
     DISCOVERY — star flies to the constellation
     --------------------------------------------------------- */
  function celebrateDiscovery(id) {
    const index = state.starsLit() - 1;
    const from = objs[id] ? objs[id].querySelector("svg") : null;
    const reveal = () => BQ.main.updateHud(true);
    audio.play("sparkle");
    // Wait for the panel to finish closing if one is open.
    if (ui.panelId) setTimeout(() => ui.flyStar(from, index, reveal), 50);
    else ui.flyStar(from, index, reveal);
  }

  function onCoreComplete() {
    setTimeout(() => {
      audio.play("unlock");
      const c = centerOf(objs.gift.querySelector("svg"));
      particles.burst(c.x, c.y, { count: 40, speed: 6 });
      objs.gift.classList.add("just-unlocked");
      setTimeout(() => objs.gift.classList.remove("just-unlocked"), 1600);
      ui.toast({ title: "Your gift is unlocked 🎁", text: "All five stars are lit. Go open it.", icon: "🔓" });
      refresh();
    }, 1500);
  }

  /* ---------------------------------------------------------
     PANELS — one opener per object
     --------------------------------------------------------- */
  const fillText = (root, key, text) => { const el = root.querySelector(`[data-fill="${key}"]`); if (el) el.textContent = fmt(text); };

  const openers = {
    envelope(origin) {
      ui.openPanel("envelope", {
        origin, variant: "paper",
        fill: (root) => {
          const d = data.letter;
          fillText(root, "greeting", d.greeting);
          root.querySelector('[data-fill="paragraphs"]').innerHTML = d.paragraphs.map((p) => `<p>${esc(fmt(p))}</p>`).join("");
          fillText(root, "signoff", d.signoff);
          state.discover("envelope");
        }
      });
    },

    cake(origin) {
      ui.openPanel("cake", {
        origin,
        fill: (root) => {
          const d = data.cake;
          fillText(root, "title", d.title);
          fillText(root, "prompt", d.prompt);
          fillText(root, "holdLabel", state.get().wished ? "Make another wish" : d.holdLabel);
          if (state.get().wished) root.querySelector(".cake-scene__art").classList.add("is-relit");
          setupHold(root.querySelector("[data-hold]"), () => makeWish(root));
        }
      });
    },

    photos(origin) {
      ui.openPanel("photos", {
        origin, variant: "wide",
        fill: (root) => { BQ.gallery.buildBoard(root.querySelector('[data-fill="board"]')); state.discover("photos"); }
      });
    },

    music(origin) {
      ui.openPanel("music", {
        origin, variant: "compact",
        fill: (root) => audio.mountPlayer(root.querySelector('[data-fill="player"]'))
      });
    },

    notes(origin) {
      ui.openPanel("notes", {
        origin, variant: "wide",
        fill: (root) => {
          const d = data.aboutHer;
          fillText(root, "title", d.title);
          fillText(root, "subtitle", d.subtitle);
          const grid = root.querySelector('[data-fill="cards"]');
          grid.innerHTML = d.cards.map((c, i) => `
            <button class="note-card" type="button" aria-expanded="false" style="--i:${i}">
              <span class="note-card__front"><span class="note-card__icon" aria-hidden="true">${esc(c.icon)}</span><span class="note-card__title">${esc(fmt(c.title))}</span></span>
              <span class="note-card__back"><span class="note-card__title">${esc(fmt(c.title))}</span><ul>${c.items.map((it) => `<li>${esc(fmt(it))}</li>`).join("")}</ul></span>
            </button>`).join("");
          grid.querySelectorAll(".note-card").forEach((card) => card.addEventListener("click", () => {
            const open = card.classList.toggle("is-open");
            card.setAttribute("aria-expanded", String(open));
            audio.play(open ? "sparkle" : "click", { volume: 0.4, pitch: rand(-200, 200) });
            if (open) state.discover("notes");
          }));
        }
      });
    },

    gift(origin) { openGift(origin); },

    window() {
      audio.play("click");
      BQ.game.open();
    },

    plushie(origin) {
      audio.play("click", { volume: 0.4 });
      origin.classList.remove("is-squish"); void origin.offsetWidth; origin.classList.add("is-squish");
      plushTaps++;
      clearTimeout(plushTapTimer);
      plushTapTimer = setTimeout(() => { plushTaps = 0; }, 1800);
      if (plushTaps >= 5) { plushTaps = 0; secret("plushie", origin); return; }
      const step = highlightNext();
      const found = state.get().secrets.length;
      say(step ? step.hint : `You've done everything! Secrets found: ${found} of ${state.SECRET_IDS.length}`);
    },

    mystery() { BQ.final.play(); }
  };

  /* ---------- Cake: press-and-hold to wish ---------- */
  function setupHold(btn, onDone) {
    const HOLD = 1400;
    let anim = null, timer = null;
    const ring = btn.querySelector("circle");
    const start = (e) => {
      if (e && e.type === "keydown" && (e.repeat || !["Enter", " "].includes(e.key))) return;
      if (e) e.preventDefault();
      if (timer || btn.disabled) return;
      btn.classList.add("is-holding");
      // The ring is only visual; the timer decides when the wish is made.
      anim = ring.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: HOLD, fill: "forwards", easing: "linear" });
      timer = setTimeout(() => {
        timer = null;
        btn.classList.remove("is-holding");
        btn.disabled = true;
        onDone();
      }, HOLD);
    };
    const cancel = () => {
      if (!timer) return;
      clearTimeout(timer); timer = null;
      if (anim) anim.cancel();
      anim = null;
      btn.classList.remove("is-holding");
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("keydown", start);
    ["pointerup", "pointerleave", "pointercancel", "keyup", "blur"].forEach((t) => btn.addEventListener(t, cancel));
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  async function makeWish(root) {
    const art = root.querySelector(".cake-scene__art");
    art.classList.remove("is-relit");
    art.classList.add("is-out");
    audio.play("sparkle");
    await sleep(700);
    const veil = $("#wish-veil");
    $("#wish-text").textContent = fmt(data.cake.afterWish);
    veil.hidden = false;
    animate(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 900 });
    particles.starBloom(70);
    await sleep(3200);
    await animate(veil, [{ opacity: 1 }, { opacity: 0 }], { duration: 700 }).finished;
    veil.hidden = true;
    veil.getAnimations().forEach((a) => a.cancel());
    state.set("wished", true);
    await ui.closePanel();
    state.discover("cake");
    refresh();
  }

  /* ---------- Gift ---------- */
  function openGift(origin) {
    const lock = lockInfo("gift");
    if (lock) return lockedNudge(origin, lock);
    ui.openPanel("gift", {
      origin,
      fill: (root) => {
        const d = data.gift;
        fillText(root, "title", d.title);
        fillText(root, "message", d.message);
        fillText(root, "starMapNote", d.starMapNote);
        root.querySelector("[data-go-window]").textContent = fmt(d.goLabel);
        root.querySelector("[data-go-window]").addEventListener("click", async () => {
          await ui.closePanel();
          BQ.game.open();
        });
        if (d.photo) mountGiftPhoto(root.querySelector('[data-fill="photo"]'), d);
        const openBtn = root.querySelector("[data-open-gift]");
        if (state.get().giftOpen) revealGift(root, true);
        else openBtn.addEventListener("click", () => unwrap(root), { once: true });
      }
    });
  }

  /** The photo inside the gift: a polaroid that keeps the photo's real shape. */
  function mountGiftPhoto(container, d) {
    container.innerHTML = `
      <figure class="gift-photo">
        <span class="polaroid__tape" aria-hidden="true"></span>
        <span class="gift-photo__img"><img src="${esc(d.photo)}" alt="${esc(fmt(d.photoAlt))}" loading="lazy" decoding="async"></span>
        ${d.photoCaption ? `<figcaption class="polaroid__caption">${esc(fmt(d.photoCaption))}</figcaption>` : ""}
      </figure>`;
    const img = container.querySelector("img");
    const box = container.querySelector(".gift-photo__img");
    img.addEventListener("load", () => {
      box.style.setProperty("--ar", `${img.naturalWidth} / ${img.naturalHeight}`);
      box.style.setProperty("--arnum", (img.naturalWidth / img.naturalHeight).toFixed(4));
    });
    img.addEventListener("error", () => {
      box.classList.add("is-missing");
      box.dataset.label = "Add your photo at assets/gift/gift-photo.jpg";
      img.remove();
    });
  }

  async function unwrap(root) {
    const stage = root.querySelector(".gift-scene__stage");
    const btn = root.querySelector("[data-open-gift]");
    btn.disabled = true;
    const art = stage.querySelector(".gift-scene__art");
    art.classList.add("is-shaking");
    audio.play("click");
    await sleep(900);
    art.classList.remove("is-shaking");
    art.classList.add("is-open");
    audio.play("celebration");
    const c = centerOf(art);
    particles.burst(c.x, c.y - 20, { count: 70, speed: 8, gravity: 0.12 });
    particles.burst(c.x, c.y - 20, { count: 20, shape: "star", speed: 5 });
    await sleep(900);
    state.set("giftOpen", true);
    revealGift(root, false);
    refresh();
  }

  function revealGift(root, instant) {
    const stage = root.querySelector(".gift-scene__stage");
    const inside = root.querySelector(".gift-scene__inside");
    stage.querySelector("[data-open-gift]").hidden = true;
    stage.querySelector(".gift-scene__art").classList.add("is-open", "is-small");
    inside.hidden = false;
    if (!instant) {
      Array.from(inside.children).forEach((el, i) => animate(el, [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 150 + i * 220 }));
    }
  }

  /** Shake + tooltip when a locked object is tapped. */
  function lockedNudge(el, text) {
    audio.play("click", { volume: 0.3 });
    el.classList.remove("is-nudged"); void el.offsetWidth; el.classList.add("is-nudged");
    ui.showTooltip(el, text);
    setTimeout(ui.hideTooltip, 2400);
  }

  /* ---------------------------------------------------------
     AMBIENT DETAILS
     --------------------------------------------------------- */
  function buildAmbient() {
    $(".room__lights").innerHTML = BQ.art.fairyLights();
    const motes = $(".room__motes");
    const count = BQ.utils.reducedMotion() ? 0 : window.innerWidth < 600 ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const m = document.createElement("span");
      m.style.setProperty("--x", `${rand(0, 100)}%`);
      m.style.setProperty("--y", `${rand(10, 90)}%`);
      m.style.setProperty("--d", `${rand(9, 18)}s`);
      m.style.setProperty("--delay", `${rand(-18, 0)}s`);
      m.style.setProperty("--s", `${rand(2, 5)}px`);
      motes.append(m);
    }
  }

  function scheduleShootingStar() {
    const star = $(".shooting-star");
    const fly = () => {
      if (ui.scene === "room" && !ui.panelId && !document.hidden) {
        star.hidden = false;
        star.tabIndex = 0;
        star.classList.remove("is-flying"); void star.offsetWidth; star.classList.add("is-flying");
        setTimeout(() => { star.hidden = true; star.tabIndex = -1; }, 2600);
      }
      setTimeout(fly, rand(16000, 26000));
    };
    setTimeout(fly, rand(9000, 14000));
    star.addEventListener("click", (e) => { e.stopPropagation(); secret("shootingStar", star); star.hidden = true; });
  }

  function setupNameSecret() {
    const target = String(data.name).toLowerCase().replace(/[^a-z]/g, "");
    if (!target) return;
    let buffer = "";
    document.addEventListener("keydown", (e) => {
      if (ui.scene !== "room" || e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
      if (buffer === target) secret("typedName", objs.plushie);
    });
  }

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */
  function init() {
    ui.injectArt($("#room"));
    $$(".obj").forEach((el) => {
      const id = el.dataset.obj;
      objs[id] = el;
      el.type = "button";
      el.insertAdjacentHTML("beforeend", '<span class="obj__badge" aria-hidden="true" hidden></span>');

      el.addEventListener("click", () => {
        resetIdle();
        const lock = lockInfo(id);
        if (lock) return lockedNudge(el, lock);
        if (id !== "window" && id !== "plushie" && id !== "mystery") audio.play("click", { volume: 0.4 });
        openers[id](el);
      });

      const tipText = () => lockInfo(id) || TIPS[id];
      el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") ui.showTooltip(el, tipText()); });
      el.addEventListener("pointerleave", ui.hideTooltip);
      el.addEventListener("focus", () => { if (el.matches(":focus-visible")) ui.showTooltip(el, tipText()); });
      el.addEventListener("blur", ui.hideTooltip);

      // Soft pointer tilt on desktop.
      el.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || BQ.utils.reducedMotion()) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", ((e.clientX - r.left) / r.width - 0.5).toFixed(2));
        el.style.setProperty("--ty", ((e.clientY - r.top) / r.height - 0.5).toFixed(2));
      });
    });

    // Secret: hold the cake after the wish.
    onLongPress(objs.cake, 900, () => { if (state.get().wished) secret("cake", objs.cake); });
    // Secret: tiny sparkle on the rug.
    $(".rug-sparkle").addEventListener("click", (e) => secret("rug", e.currentTarget));

    buildAmbient();
    scheduleShootingStar();
    setupNameSecret();

    ["pointerdown", "keydown"].forEach((t) => document.addEventListener(t, resetIdle, { passive: true }));
    window.addEventListener("resize", () => { if (!bubble.hidden) positionBubble(); });

    state.on("discover", (id) => { celebrateDiscovery(id); refresh(); });
    state.on("coreComplete", onCoreComplete);
    state.on("reset", refresh);
    refresh();
  }

  /** First-visit welcome once the room appears. */
  function welcome() {
    resetIdle();
    const step = nextStep();
    setTimeout(() => {
      if (!step) return say(`Welcome back, {name}. You found ${state.get().secrets.length} of ${state.SECRET_IDS.length} secrets.`);
      highlightNext();
      say(step.id === "envelope" ? "Hi {name}! Start with the letter 💌" : step.hint, 5000);
    }, 1400);
  }

  return { init, welcome, refresh, STEPS, say, secret };
})();
