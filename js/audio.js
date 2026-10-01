/* =============================================================
   AUDIO — optional sound effects + the music player.
   Nothing plays until she has clicked "Enter".
   If a sound file is missing, a soft synthesized tone is used,
   so the experience never goes silent or throws errors.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.audio = (() => {
  const { $, fmt, esc } = BQ.utils;
  const state = BQ.state;
  const data = BQ.data;

  let ctx = null;          // Web Audio context for fallback tones
  let unlocked = false;
  const base = {};         // preloaded <audio> elements per effect

  /* ---------- Unlock (must be called from a user gesture) ---------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (_) { ctx = null; }
    Object.entries(data.sounds).forEach(([name, src]) => {
      const a = new Audio();
      a.preload = "auto";
      a.src = src;
      a.addEventListener("error", () => { base[name] = null; });
      base[name] = a;
    });
    music.el.muted = state.get().muted;
  }

  /* ---------- Synth fallback tones ---------- */
  function tone(freq, start, dur, type = "sine", vol = 0.08) {
    if (!ctx) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const synths = {
    click: () => tone(720, 0, 0.08, "triangle", 0.05),
    sparkle: (pitch = 0) => { tone(1320 + pitch, 0, 0.18); tone(1760 + pitch, 0.06, 0.22, "sine", 0.05); },
    unlock: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, "sine", 0.07)),
    celebration: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.6, "triangle", 0.05))
  };

  /** Play a sound effect by name. `pitch` only affects fallback tones. */
  function play(name, { volume = 0.6, pitch = 0 } = {}) {
    if (!unlocked || state.get().muted) return;
    if (ctx && ctx.state === "suspended") ctx.resume();
    const a = base[name];
    if (!a) return synths[name] && synths[name](pitch);
    const node = a.cloneNode();
    node.volume = volume;
    node.play().catch(() => synths[name] && synths[name](pitch));
  }

  /* ---------- Music ---------- */
  const music = {
    el: new Audio(),
    missing: false,
    ui: null
  };
  music.el.preload = "none";
  music.el.src = data.music.src;
  music.el.addEventListener("error", () => { music.missing = true; music.el.pause(); renderPlayer(); });
  ["play", "pause", "ended"].forEach((t) => music.el.addEventListener(t, renderPlayer));
  music.el.addEventListener("timeupdate", renderProgress);
  music.el.addEventListener("loadedmetadata", renderProgress);

  const fmtTime = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  function toggleMusic() {
    if (music.missing) return renderPlayer();
    if (music.el.paused) {
      music.el.volume = 0.8;
      music.el.play().catch(() => { music.missing = true; renderPlayer(); });
    } else {
      music.el.pause();
    }
  }

  /** Softly fade the music out (used when a video starts). */
  function pauseMusic() {
    if (music.el.paused) return;
    const start = music.el.volume;
    let v = start;
    const id = setInterval(() => {
      v -= start / 10;
      if (v <= 0.02) { clearInterval(id); music.el.pause(); music.el.volume = start; }
      else music.el.volume = v;
    }, 40);
  }

  /** Build the player UI inside a given container (the headphones panel). */
  function mountPlayer(root) {
    const m = data.music;
    root.innerHTML = `
      <div class="player">
        <div class="player__art">
          <img src="${esc(m.artwork)}" alt="" loading="lazy">
          <span class="player__art-fallback" aria-hidden="true">♪</span>
        </div>
        <div class="player__meta">
          <p class="player__title">${esc(fmt(m.title))}</p>
          <p class="player__artist">${esc(fmt(m.artist))}</p>
        </div>
        <div class="player__eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="player__progress">
          <input type="range" class="player__seek" min="0" max="1000" value="0" aria-label="Song position">
          <div class="player__times"><span data-cur>0:00</span><span data-dur>0:00</span></div>
        </div>
        <button class="player__toggle" type="button" aria-label="Play song">
          <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>
          <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
        </button>
        <p class="player__status" role="status"></p>
      </div>`;
    const img = $("img", root);
    img.addEventListener("error", () => img.remove());
    $(".player__toggle", root).addEventListener("click", () => {
      toggleMusic();
      state.discover("music");
    });
    const seek = $(".player__seek", root);
    seek.addEventListener("input", () => {
      if (isFinite(music.el.duration)) music.el.currentTime = (seek.value / 1000) * music.el.duration;
    });
    music.ui = root;
    renderPlayer();
    renderProgress();
  }

  function renderPlayer() {
    const playing = !music.el.paused && !music.missing;
    document.body.classList.toggle("is-music-playing", playing);
    const mini = $("#mini-player");
    if (mini) {
      mini.hidden = music.missing || (!playing && music.el.currentTime === 0);
      $(".mini-player__title", mini).textContent = fmt(data.music.title);
      mini.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${fmt(data.music.title)}`);
    }
    if (!music.ui || !music.ui.isConnected) return;
    const btn = $(".player__toggle", music.ui);
    btn.setAttribute("aria-label", playing ? "Pause song" : "Play song");
    $(".player", music.ui).classList.toggle("is-playing", playing);
    $(".player__status", music.ui).textContent = music.missing
      ? "Add the song file at assets/music/birthday-song.mp3 to hear it here."
      : "";
  }

  function renderProgress() {
    if (!music.ui || !music.ui.isConnected) return;
    const d = music.el.duration;
    const c = music.el.currentTime;
    $("[data-cur]", music.ui).textContent = fmtTime(c);
    $("[data-dur]", music.ui).textContent = fmtTime(d);
    if (isFinite(d) && d > 0) $(".player__seek", music.ui).value = Math.round((c / d) * 1000);
  }

  /* ---------- Mute ---------- */
  function setMuted(m) {
    state.set("muted", m);
    music.el.muted = m;
    document.querySelectorAll("video").forEach((v) => { if (!v.dataset.userVolume) v.muted = m; });
    const btn = $("#btn-sound");
    if (btn) {
      btn.setAttribute("aria-pressed", String(!m));
      btn.setAttribute("aria-label", m ? "Turn sound on" : "Turn sound off");
      btn.classList.toggle("is-muted", m);
    }
  }

  function initControls() {
    $("#btn-sound").addEventListener("click", () => { setMuted(!state.get().muted); play("click"); });
    $("#mini-player").addEventListener("click", toggleMusic);
    setMuted(state.get().muted);
    renderPlayer();
  }

  return { unlock, play, mountPlayer, toggleMusic, pauseMusic, setMuted, initControls };
})();
