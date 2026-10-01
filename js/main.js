/* =============================================================
   MAIN — boots everything and wires scenes together.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.main = (() => {
  const { $, $$, fmt, esc, animate } = BQ.utils;
  const { data, state, ui, audio, particles, room } = BQ;

  const api = { pendingStarFrom: null };

  /* ---------- HUD ---------- */
  function updateHud(pulse = false) {
    const lit = state.starsLit();
    ui.renderConstellation($("#hud-constellation"), lit);
    $("#hud-count").textContent = `${lit} of 6`;
    $("#btn-journey").setAttribute("aria-label", `Your progress: ${lit} of 6 stars lit. Open quest list`);
    if (pulse) {
      const star = $(`#hud-constellation .c-star[data-i="${lit - 1}"]`);
      if (star) star.classList.add("is-new");
      const chip = $("#btn-journey");
      chip.classList.remove("is-pulse"); void chip.offsetWidth; chip.classList.add("is-pulse");
    }
  }
  api.updateHud = updateHud;

  /* ---------- Journey sheet ---------- */
  function openJourney(origin) {
    ui.openPanel("journey", {
      origin, variant: "compact",
      fill: (root) => {
        const next = room.STEPS.find((s) => !s.done());
        root.querySelector('[data-fill="steps"]').innerHTML = room.STEPS.map((s) => {
          const done = s.done();
          const cls = done ? "is-done" : s === next ? "is-current" : "";
          const status = done ? "Done" : s === next ? "Up next" : "Not yet";
          return `<li class="journey__step ${cls}"><span class="journey__dot" aria-hidden="true"></span><span>${esc(s.label)}</span><span class="visually-hidden">: ${status}</span></li>`;
        }).join("");
        const found = state.get().secrets.length;
        root.querySelector('[data-fill="secrets"]').textContent =
          `Secrets found: ${found} of ${state.SECRET_IDS.length}${found < state.SECRET_IDS.length ? ". Keep poking around 👀" : ". You found them all!"}`;
        root.querySelector("[data-reset]").addEventListener("click", (e) => {
          const b = e.currentTarget;
          if (b.dataset.confirm) {
            state.reset();
            ui.closePanel().then(() => { updateHud(); room.refresh(); room.welcome(); });
          } else {
            b.dataset.confirm = "1";
            b.textContent = "Tap again to erase all progress";
          }
        });
        root.querySelector("[data-replay-intro]").addEventListener("click", async () => {
          await ui.closePanel();
          await ui.goScene("intro");
          BQ.intro.run();
        });
      }
    });
  }

  /* ---------- Enter the world ---------- */
  let firstEnter = true;
  async function enter({ withSound, from }) {
    audio.unlock();
    audio.setMuted(!withSound);
    audio.play("sparkle");
    const c = BQ.utils.centerOf(from);
    particles.burst(c.x, c.y, { count: 36, speed: 6 });
    state.set("entered", true);
    await ui.goScene("room");
    if (firstEnter) {
      firstEnter = false;
      revealRoom();
    }
    room.welcome();
  }

  /** The one orchestrated moment: objects settle into the room. */
  function revealRoom() {
    $$(".room__stage .spot").forEach((spot, i) => {
      animate(spot, [
        { opacity: 0, transform: "translateY(26px) scale(.92)" },
        { opacity: 1, transform: "none" }
      ], { duration: 800, delay: 250 + i * 90, easing: "cubic-bezier(.2,1.25,.4,1)" })
        .finished.then((a) => a && a.cancel && a.cancel());
    });
  }

  /* ---------- Returning to the room ---------- */
  function goRoom() {
    BQ.game.stop();
    $$("#final video").forEach((v) => v.pause());
    ui.goScene("room");
  }

  function onRoomShown() {
    room.refresh();
    updateHud();
    if (api.pendingStarFrom) {
      const id = api.pendingStarFrom;
      api.pendingStarFrom = null;
      setTimeout(() => {
        const from = $(`.obj[data-obj="${id}"] svg`);
        audio.play("sparkle");
        ui.flyStar(from, state.starsLit() - 1, () => {
          updateHud(true);
          audio.play("unlock");
          const box = $('.obj[data-obj="mystery"]');
          const c = BQ.utils.centerOf(box.querySelector("svg"));
          particles.burst(c.x, c.y, { count: 40, speed: 6, shape: "star" });
          box.classList.add("just-unlocked");
          setTimeout(() => box.classList.remove("just-unlocked"), 1600);
          ui.toast({ title: "All six stars are lit ✨", text: "The mystery box just unlocked.", icon: "🔓" });
        });
      }, 700);
    }
  }

  /* ---------- Dev tools (?dev in the URL) ---------- */
  function devBar() {
    const bar = BQ.utils.html(`
      <div class="dev-bar" role="group" aria-label="Test tools">
        <strong>Test mode</strong>
        <button type="button" data-dev="unlock">Unlock all</button>
        <button type="button" data-dev="game">Game</button>
        <button type="button" data-dev="final">Finale</button>
        <button type="button" data-dev="reset">Reset</button>
      </div>`);
    document.body.append(bar);
    bar.addEventListener("click", async (e) => {
      const a = e.target.dataset.dev;
      if (!a) return;
      if (ui.scene === "intro") { audio.unlock(); await ui.goScene("room"); }
      if (a === "unlock") { state.unlockAll(); updateHud(); room.refresh(); }
      if (a === "game") BQ.game.open();
      if (a === "final") BQ.final.play();
      if (a === "reset") { state.reset(); updateHud(); room.refresh(); }
    });
  }

  /* ---------- Boot ---------- */
  function applyColors() {
    Object.entries(data.colors || {}).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }

  function boot() {
    document.title = `${fmt("{name}")}'s Birthday Quest`;
    document.body.dataset.scene = "intro";
    applyColors();
    particles.init();
    ui.initPanel();
    audio.initControls();
    BQ.gallery.init();
    room.init();
    BQ.game.init();
    BQ.final.init();
    BQ.intro.init(enter);

    $("#btn-journey").addEventListener("click", (e) => { audio.play("click", { volume: 0.4 }); openJourney(e.currentTarget); });
    document.addEventListener("click", (e) => { if (e.target.closest("[data-go-room]")) goRoom(); });
    ui.onScene("room", onRoomShown);

    // Magnetic buttons (desktop only).
    $$(".btn--magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || BQ.utils.reducedMotion()) return;
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
        b.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.25}px`);
      });
      b.addEventListener("pointerleave", () => { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });

    updateHud();
    if (state.dev) devBar();
    BQ.intro.run();
  }

  api.boot = boot;
  return api;
})();

document.addEventListener("DOMContentLoaded", BQ.main.boot);
