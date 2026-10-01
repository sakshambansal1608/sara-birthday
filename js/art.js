/* =============================================================
   ART — hand-built SVG illustrations for every object.
   Kept in one place so the room and the panels share the same
   drawings, and so individual parts (flames, lid, ears) can be
   animated with CSS. `uid` keeps gradient ids unique.
   ============================================================= */
window.BQ = window.BQ || {};

BQ.art = (() => {
  let n = 0;
  const uid = () => `a${++n}`;

  /** Points for a 5-point star polygon. */
  function starPoints(cx, cy, R, r = R * 0.45) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r : R;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  const flame = (x, y) => `
    <g class="flame" transform="translate(${x} ${y})">
      <circle class="flame__glow" r="11" fill="#FFD98A"/>
      <path class="flame__outer" d="M0,-11 C5,-4 6,1 0,5 C-6,1 -5,-4 0,-11Z" fill="#FFC56B"/>
      <path class="flame__inner" d="M0,-5 C2.4,-1.5 2.6,1 0,3 C-2.6,1 -2.4,-1.5 0,-5Z" fill="#FFF4D2"/>
      <path class="smoke" d="M0,-2 C-4,-8 4,-12 0,-18 C-3,-22 2,-26 0,-30" fill="none" stroke="#D9D2E6" stroke-width="2" stroke-linecap="round"/>
    </g>`;

  function cake() {
    const drip = (x0, x1, y, fill) => {
      let d = `M${x0},${y - 6} L${x1},${y - 6} L${x1},${y}`;
      const steps = 6;
      const step = (x1 - x0) / steps;
      for (let i = steps; i > 0; i--) {
        const xm = x0 + step * (i - 0.5);
        const deep = i % 2 ? 9 : 4;
        d += ` Q${xm},${y + deep} ${x0 + step * (i - 1)},${y}`;
      }
      return `<path d="${d} Z" fill="${fill}"/>`;
    };
    return `
    <svg class="art art--cake" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="152" rx="64" ry="7" fill="#2B2745" opacity=".08"/>
      <ellipse cx="80" cy="148" rx="62" ry="8" fill="#FFFFFF"/>
      <rect x="28" y="104" width="104" height="44" rx="10" fill="#F7E6D8"/>
      <rect x="28" y="130" width="104" height="18" rx="9" fill="#F1D9C7"/>
      ${drip(28, 132, 110, "#F4B69C")}
      <rect x="44" y="72" width="72" height="38" rx="9" fill="#FCF5EC"/>
      ${drip(44, 116, 78, "#C9BEEA")}
      <g fill="#8E9BE0"><rect x="52" y="92" width="6" height="2.4" rx="1.2" transform="rotate(-25 55 93)"/><rect x="98" y="96" width="6" height="2.4" rx="1.2" transform="rotate(30 101 97)"/><rect x="42" y="124" width="6" height="2.4" rx="1.2" transform="rotate(20 45 125)"/></g>
      <g fill="#F2D27A"><rect x="76" y="98" width="6" height="2.4" rx="1.2" transform="rotate(10 79 99)"/><rect x="108" y="126" width="6" height="2.4" rx="1.2" transform="rotate(-30 111 127)"/><rect x="70" y="132" width="6" height="2.4" rx="1.2" transform="rotate(40 73 133)"/></g>
      <g fill="#EFA7B5"><rect x="90" y="86" width="6" height="2.4" rx="1.2" transform="rotate(-40 93 87)"/><rect x="58" y="118" width="6" height="2.4" rx="1.2"/></g>
      <g class="candles">
        ${[62, 80, 98].map((x) => `<rect x="${x - 3}" y="50" width="6" height="24" rx="2" fill="#FFFDF8"/><path d="M${x - 3},56 l6,-3 M${x - 3},63 l6,-3 M${x - 3},70 l6,-3" stroke="#F4B69C" stroke-width="2"/>`).join("")}
        ${[62, 80, 98].map((x) => flame(x, 44)).join("")}
      </g>
    </svg>`;
  }

  function gift() {
    return `
    <svg class="art art--gift" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="152" rx="58" ry="6" fill="#2B2745" opacity=".1"/>
      <g class="gift-glow" opacity="0">
        ${[0, 30, 60, 90, 120, 150].map((a) => `<rect x="78" y="10" width="4" height="46" rx="2" fill="#F2D27A" transform="rotate(${a - 75} 80 84)"/>`).join("")}
      </g>
      <rect x="30" y="80" width="100" height="70" rx="6" fill="#8E9BE0"/>
      <rect x="30" y="80" width="100" height="12" fill="#7C88D2"/>
      <rect x="74" y="80" width="12" height="70" fill="#F2D27A"/>
      <g class="gift-lid">
        <rect x="24" y="64" width="112" height="22" rx="6" fill="#A6AFEE"/>
        <rect x="74" y="64" width="12" height="22" fill="#F7DE95"/>
        <ellipse cx="66" cy="58" rx="16" ry="9" fill="#F2D27A" transform="rotate(-22 66 58)"/>
        <ellipse cx="94" cy="58" rx="16" ry="9" fill="#F2D27A" transform="rotate(22 94 58)"/>
        <ellipse cx="66" cy="58" rx="7" ry="3.5" fill="#E2BC5E" transform="rotate(-22 66 58)"/>
        <ellipse cx="94" cy="58" rx="7" ry="3.5" fill="#E2BC5E" transform="rotate(22 94 58)"/>
        <circle cx="80" cy="62" r="7" fill="#F7DE95"/>
      </g>
    </svg>`;
  }

  function photoFrame() {
    const id = uid();
    return `
    <svg class="art art--photo" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C9B4"/><stop offset="1" stop-color="#F3DFC6"/></linearGradient></defs>
      <ellipse cx="80" cy="153" rx="42" ry="5" fill="#2B2745" opacity=".1"/>
      <path d="M96 150 L108 112" stroke="#C8A98F" stroke-width="5" stroke-linecap="round"/>
      <g transform="rotate(-6 80 96)">
        <rect x="36" y="40" width="88" height="108" rx="4" fill="#FFFDF8"/>
        <rect x="44" y="48" width="72" height="70" rx="2" fill="url(#${id})"/>
        <circle cx="96" cy="68" r="8" fill="#FFF1C9"/>
        <path d="M44 118 L44 100 Q62 84 78 98 Q92 86 116 102 L116 118Z" fill="#B9ADE3"/>
        <path d="M44 118 L44 108 Q70 96 116 112 L116 118Z" fill="#9C8FD6"/>
        <rect x="68" y="34" width="26" height="11" rx="1" fill="#F2D27A" opacity=".75" transform="rotate(4 81 39)"/>
        <path d="M52 132 q14 -6 28 0 t26 0" stroke="#CFC6E4" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function headphones() {
    return `
    <svg class="art art--phones" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="152" rx="46" ry="5" fill="#2B2745" opacity=".1"/>
      <path d="M40 112 V92 a40 40 0 0 1 80 0 V112" fill="none" stroke="#8E86B8" stroke-width="9" stroke-linecap="round"/>
      <path d="M44 96 a36 36 0 0 1 72 0" fill="none" stroke="#A69FCC" stroke-width="3" stroke-linecap="round"/>
      <rect x="26" y="100" width="30" height="46" rx="13" fill="#F4B69C"/>
      <rect x="104" y="100" width="30" height="46" rx="13" fill="#F4B69C"/>
      <rect x="46" y="106" width="12" height="34" rx="6" fill="#E89E86"/>
      <rect x="102" y="106" width="12" height="34" rx="6" fill="#E89E86"/>
      <g class="music-notes" fill="#8E9BE0">
        <path class="note note--1" d="M70 58 v-16 l12 -3 v14" stroke="#8E9BE0" stroke-width="2.5" fill="none"/><circle class="note note--1" cx="67" cy="58" r="4"/>
        <path class="note note--2" d="M96 48 v-14" stroke="#B9ADE3" stroke-width="2.5"/><circle class="note note--2" cx="93" cy="48" r="4" fill="#B9ADE3"/>
      </g>
    </svg>`;
  }

  function plushie() {
    return `
    <svg class="art art--plush" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="154" rx="48" ry="5" fill="#2B2745" opacity=".1"/>
      <g class="plush-body">
        <g class="plush-ears">
          <g transform="rotate(-12 64 62)"><ellipse cx="64" cy="40" rx="10" ry="28" fill="#F6EEE8"/><ellipse cx="64" cy="42" rx="5" ry="19" fill="#F3B7C0"/></g>
          <g class="plush-ear-r" transform="rotate(14 96 62)"><ellipse cx="96" cy="40" rx="10" ry="28" fill="#F6EEE8"/><ellipse cx="96" cy="42" rx="5" ry="19" fill="#F3B7C0"/></g>
        </g>
        <ellipse cx="80" cy="124" rx="40" ry="30" fill="#F6EEE8"/>
        <ellipse cx="80" cy="128" rx="24" ry="18" fill="#FFFFFF" opacity=".7"/>
        <circle cx="80" cy="84" r="30" fill="#F6EEE8"/>
        <path d="M58 104 Q80 116 102 104 L98 112 Q80 120 62 112Z" fill="#B9ADE3"/>
        <circle class="plush-eye" cx="70" cy="84" r="3.4" fill="#2B2745"/>
        <circle class="plush-eye" cx="90" cy="84" r="3.4" fill="#2B2745"/>
        <ellipse cx="63" cy="93" rx="6" ry="3.5" fill="#F3B7C0" opacity=".85"/>
        <ellipse cx="97" cy="93" rx="6" ry="3.5" fill="#F3B7C0" opacity=".85"/>
        <path d="M77 90 q3 3 6 0" stroke="#2B2745" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <ellipse cx="58" cy="148" rx="13" ry="7" fill="#EFE3DA"/>
        <ellipse cx="102" cy="148" rx="13" ry="7" fill="#EFE3DA"/>
      </g>
    </svg>`;
  }

  function envelope() {
    return `
    <svg class="art art--envelope" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="152" rx="54" ry="5" fill="#2B2745" opacity=".1"/>
      <g class="envelope-body">
        <rect x="26" y="74" width="108" height="72" rx="6" fill="#FCF5EC"/>
        <path d="M26 146 L72 108 M134 146 L88 108" stroke="#EADCCB" stroke-width="2"/>
        <path d="M26 78 L80 116 L134 78" fill="#F1E4D6"/>
        <circle cx="80" cy="112" r="11" fill="#E78F9E"/>
        <path d="M80 117 C73 112 75 106 80 109 C85 106 87 112 80 117Z" fill="#FFF5F3"/>
      </g>
    </svg>`;
  }

  function jar() {
    const papers = [
      [62, 120, 7, "#F2D27A", 10], [84, 126, 8, "#B9ADE3", -12], [104, 118, 7, "#F4B69C", 20],
      [72, 104, 6, "#8E9BE0", 5], [95, 100, 7, "#EFA7B5", -20], [58, 138, 6, "#B9ADE3", 30],
      [80, 140, 7, "#F4B69C", 0], [102, 138, 6, "#F2D27A", 15], [86, 112, 5, "#FFFFFF", -8]
    ];
    return `
    <svg class="art art--jar" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="153" rx="44" ry="5" fill="#2B2745" opacity=".1"/>
      <rect x="40" y="58" width="80" height="92" rx="20" fill="#E7EEF7" opacity=".55"/>
      ${papers.map(([x, y, r, c, rot]) => `<polygon points="${starPoints(x, y, r)}" fill="${c}" transform="rotate(${rot} ${x} ${y})" stroke="#2B2745" stroke-opacity=".06"/>`).join("")}
      <rect x="40" y="58" width="80" height="92" rx="20" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".9"/>
      <path d="M50 72 v50" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      <rect x="46" y="44" width="68" height="16" rx="5" fill="#F2D27A"/>
      <rect x="46" y="54" width="68" height="4" fill="#E2BC5E"/>
      <rect x="58" y="76" width="44" height="18" rx="3" fill="#FFFDF8" transform="rotate(-3 80 85)"/>
      <text x="80" y="89" text-anchor="middle" font-family="Caveat, cursive" font-size="15" fill="#6E6883" transform="rotate(-3 80 85)">you</text>
    </svg>`;
  }

  function mysteryBox() {
    return `
    <svg class="art art--mystery" viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <ellipse cx="80" cy="153" rx="52" ry="5" fill="#2B2745" opacity=".14"/>
      <g class="mystery-glow" opacity="0"><ellipse cx="80" cy="100" rx="70" ry="56" fill="#F2D27A" opacity=".35"/></g>
      <rect x="34" y="72" width="92" height="78" rx="8" fill="#2B2745"/>
      <rect x="28" y="60" width="104" height="18" rx="6" fill="#3A3563"/>
      ${[[48, 92, 3], [110, 88, 2.4], [60, 132, 2.2], [104, 128, 3], [46, 114, 1.8]].map(([x, y, r]) => `<polygon points="${starPoints(x, y, r * 2)}" fill="#F2D27A" opacity=".8"/>`).join("")}
      <circle cx="80" cy="104" r="9" fill="#F2D27A"/>
      <path d="M77 106 h6 l2 14 h-10z" fill="#F2D27A"/>
      <circle cx="80" cy="104" r="3.5" fill="#2B2745"/>
    </svg>`;
  }

  function windowScene() {
    const sky = uid(), crescent = uid();
    const stars = [[62, 50, 2.2], [150, 40, 1.6], [176, 74, 2.4], [92, 86, 1.4], [128, 62, 1.2], [70, 120, 1.6], [168, 118, 1.3], [110, 36, 1.8]];
    return `
    <svg class="art art--window" viewBox="0 0 240 210" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1F2152"/><stop offset=".55" stop-color="#453D7C"/><stop offset="1" stop-color="#C98FA8"/>
        </linearGradient>
        <mask id="${crescent}"><rect width="240" height="210" fill="#fff"/><circle cx="170" cy="46" r="15" fill="#000"/></mask>
      </defs>
      <path d="M40 196 V92 a80 80 0 0 1 160 0 V196Z" fill="#FCF5EC"/>
      <path d="M52 188 V94 a68 68 0 0 1 136 0 V188Z" fill="url(#${sky})"/>
      <g class="window-stars">${stars.map(([x, y, r], i) => `<polygon class="twinkle t${i % 4}" points="${starPoints(x, y, r * 2.2)}" fill="#FFF6DA"/>`).join("")}</g>
      <circle cx="160" cy="54" r="16" fill="#FFE9B0" mask="url(#${crescent})"/>
      <path d="M52 170 Q90 150 120 164 T188 158 V188 H52Z" fill="#2E2A57" opacity=".55"/>
      <path d="M120 30 V188 M52 124 H188" stroke="#FCF5EC" stroke-width="6"/>
      <rect x="30" y="188" width="180" height="12" rx="4" fill="#F1E4D6"/>
      <path d="M22 26 Q46 30 44 110 Q40 170 56 204 H22Z" fill="#B9ADE3" opacity=".95"/>
      <path d="M218 26 Q194 30 196 110 Q200 170 184 204 H218Z" fill="#B9ADE3" opacity=".95"/>
      <path d="M30 40 Q38 110 34 196 M210 40 Q202 110 206 196" stroke="#A396D6" stroke-width="3" fill="none"/>
      <rect x="14" y="20" width="212" height="8" rx="4" fill="#C8A98F"/>
    </svg>`;
  }

  /** String of fairy lights across the top of the room. */
  function fairyLights() {
    const bulbs = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = t * 1000;
      const y = 14 + Math.sin(t * Math.PI * 3) * 18 + 22 * Math.sin(t * Math.PI);
      bulbs.push(`<g class="bulb b${i % 3}"><circle cx="${x.toFixed(0)}" cy="${(y + 8).toFixed(0)}" r="9" fill="#FFE4A3" opacity=".35"/><circle cx="${x.toFixed(0)}" cy="${(y + 8).toFixed(0)}" r="4" fill="#FFE4A3"/></g>`);
    }
    let d = "M0 14";
    for (let i = 1; i <= 60; i++) {
      const t = i / 60;
      d += ` L${(t * 1000).toFixed(0)} ${(14 + Math.sin(t * Math.PI * 3) * 18 + 22 * Math.sin(t * Math.PI)).toFixed(1)}`;
    }
    return `<svg viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="#8E86B8" stroke-width="1.5" vector-effect="non-scaling-stroke"/>${bulbs.join("")}</svg>`;
  }

  /** Falling star used in the mini-game. */
  function fallingStar(golden) {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><polygon points="${starPoints(20, 21, 17, 7.5)}" fill="${golden ? "#F2C45A" : "#FFF6DA"}" stroke="${golden ? "#FFE9A8" : "#FFFFFF"}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  }

  return { starPoints, cake, gift, photoFrame, headphones, plushie, envelope, jar, mysteryBox, windowScene, fairyLights, fallingStar };
})();
