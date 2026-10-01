/* =============================================================
   INTRO — sparkle draws itself, two short lines, then "Enter".
   About four seconds; "Skip" jumps straight to the buttons.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.intro = (() => {
  const { $, fmt, sleep, animate } = BQ.utils;
  const d = BQ.data.intro;

  const lineEl = $(".intro__line");
  const actions = $(".intro__actions");
  const skipBtn = $("#btn-skip-intro");
  let token = { skipped: false };
  let onEnter = null;

  async function showLine(text, hold) {
    lineEl.textContent = fmt(text);
    await animate(lineEl, [{ opacity: 0, transform: "translateY(8px)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 700 }).finished;
    await sleep(hold, token);
  }
  async function hideLine() {
    await animate(lineEl, [{ opacity: 1 }, { opacity: 0, filter: "blur(6px)" }], { duration: 400 }).finished;
  }

  function showActions() {
    skipBtn.hidden = true;
    actions.hidden = false;
    $("#intro").classList.add("is-ready");
    animate(actions, [{ opacity: 0, transform: "translateY(16px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,1.3,.4,1)" });
    $("#btn-enter").focus({ preventScroll: true });
  }

  async function run() {
    token = { skipped: false };
    actions.hidden = true;
    skipBtn.hidden = false;
    $("#intro").classList.remove("is-ready");
    $("#intro").classList.add("is-drawing");

    const returning = BQ.state.get().entered;
    const lines = returning ? [d.returningLine] : d.lines.slice(0, -1);
    const last = returning ? null : d.lines[d.lines.length - 1];

    await sleep(900, token);
    for (const text of lines) {
      if (token.skipped) break;
      await showLine(text, 1300);
      if (token.skipped) break;
      await hideLine();
    }
    lineEl.textContent = fmt(last || "");
    if (!token.skipped && last) await showLine(last, 250);
    lineEl.getAnimations().forEach((a) => a.cancel());
    lineEl.style.opacity = "1";
    showActions();
  }

  function skip() {
    token.skipped = true;
    if (token.onSkip) token.onSkip();
  }

  function init(enterCallback) {
    onEnter = enterCallback;
    $("#btn-enter").textContent = fmt(d.enterLabel);
    $("#btn-enter-quiet").textContent = fmt(d.quietLabel);
    skipBtn.addEventListener("click", skip);
    $("#btn-enter").addEventListener("click", (e) => onEnter({ withSound: true, from: e.currentTarget }));
    $("#btn-enter-quiet").addEventListener("click", (e) => onEnter({ withSound: false, from: e.currentTarget }));
  }

  return { init, run };
})();
