/* =============================================================
   STATE — single source of truth for progress, unlocks, secrets.
   Objects never talk to each other directly: they report to the
   state ("discovered cake"), and anything interested listens.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.state = (() => {
  const KEY = "bq-progress-v1";
  const CORE = ["envelope", "cake", "photos", "music", "notes"];
  const SECRET_IDS = ["plushie", "shootingStar", "rug", "cake", "typedName"];

  const params = new URLSearchParams(location.search);
  const dev = params.has("dev");

  const fresh = () => ({
    found: [],        // core discoveries
    secrets: [],      // easter eggs found
    wished: false,
    giftOpen: false,
    gameDone: false,
    finaleSeen: false,
    entered: false,
    muted: false
  });

  let s = fresh();
  const listeners = {};

  /* Progress lives only in memory: every page refresh starts the
     quest fresh from the intro. Any progress saved by an older
     version of the site is wiped so it can't come back. */
  function load() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  function save() { /* intentionally not persisted */ }

  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach((fn) => fn(payload));
    if (evt !== "change") (listeners.change || []).forEach((fn) => fn({ evt, payload }));
  }

  const has = (id) => s.found.includes(id);
  const coreCount = () => CORE.filter(has).length;
  const coreDone = () => coreCount() === CORE.length;
  /** Stars lit in the constellation: 5 discoveries + the mini-game. */
  const starsLit = () => coreCount() + (s.gameDone ? 1 : 0);

  /** Record a core discovery. Returns true if it was new. */
  function discover(id) {
    if (!CORE.includes(id) || has(id)) return false;
    const wasDone = coreDone();
    s.found.push(id);
    save();
    emit("discover", id);
    if (!wasDone && coreDone()) emit("coreComplete");
    return true;
  }

  /** Record a secret. Returns true if it was new. */
  function addSecret(id) {
    if (s.secrets.includes(id)) return false;
    s.secrets.push(id);
    save();
    emit("secret", id);
    return true;
  }

  function set(key, value) {
    if (s[key] === value) return;
    s[key] = value;
    save();
    emit(key, value);
  }

  function reset() {
    const muted = s.muted;
    s = fresh();
    s.muted = muted;
    save();
    emit("reset");
  }

  /** Dev helper: unlock everything to test later scenes. */
  function unlockAll() {
    CORE.forEach((id) => { if (!has(id)) s.found.push(id); });
    s.wished = true; s.giftOpen = true; s.gameDone = true;
    save();
    emit("reset");
  }

  load();

  return {
    CORE, SECRET_IDS, dev,
    get: () => s,
    has, coreCount, coreDone, starsLit,
    discover, addSecret, set, reset, unlockAll, on
  };
})();
