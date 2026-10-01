/* =============================================================
   BIRTHDAY QUEST — EVERYTHING YOU EDIT LIVES HERE
   -------------------------------------------------------------
   • Replace every [BRACKETED PLACEHOLDER] with real words.
   • "{name}" anywhere in a text is replaced with her name.
   • Paths are relative to index.html. Keep the file names the
     same and just drop your files into /assets, or change paths.
   • Missing files never break the site: photos show a soft
     placeholder card, sounds fall back to gentle built-in tones,
     and videos show a "video goes here" card.
   ============================================================= */

window.BQ = window.BQ || {};

BQ.data = {
  /* ---------- Names ---------- */
  name: "Sara",          // her name, e.g. "Simran"
  fromName: "Saksham",     // your name, used in sign-offs

  /* ---------- Intro ---------- */
  intro: {
    lines: ["Preparing something special…", "Ready?"],
    returningLine: "Welcome back, Cutie ✨",
    enterLabel: "Enter your birthday world ✨",
    quietLabel: "Enter without sound"
  },

  /* ---------- 💌 The welcome letter (envelope) ---------- */
  letter: {
    greeting: "Heyy Sara,",
    paragraphs: [
      "I built you a tiny world for your birthday. Everything in this room hides something.",
      "Tap the things around the room. Every discovery lights a star in the corner. Light all five and your gift opens."
    ],
    signoff: "— Your Love"
  },

  /* ---------- 🎂 Cake ---------- */
  cake: {
    title: "Happiest Birthday, Saruu 🎂",
    prompt: "Close your eyes, think of a wish, then press and hold the button.",
    holdLabel: "Hold to make a wish",
    afterWish: "Wish sent. The stars are on it ✨"
  },

  /* ---------- 📸 Scrapbook photos ----------
     Add as many as you like. "date" is optional. */
  photos: [
    { src: "assets/photos/photo1.jpg", alt: "[DESCRIBE PHOTO 1]", caption: "The Starting" },
    { src: "assets/photos/photo2.jpg", alt: "[DESCRIBE PHOTO 2]", caption: "My Personal one" },
    { src: "assets/photos/photo3.jpg", alt: "[DESCRIBE PHOTO 3]", caption: "First photo u send me" },
    { src: "assets/photos/photo4.jpg", alt: "[DESCRIBE PHOTO 4]", caption: "Our First meet" },
    { src: "assets/photos/photo5.jpg", alt: "[DESCRIBE PHOTO 5]", caption: "Starting Video Calls" },
    { src: "assets/photos/photo6.jpg", alt: "[DESCRIBE PHOTO 6]", caption: "If we were from 90's" }
  ],

  /* ---------- 🎧 Music ---------- */
  music: {
    src: "assets/music/birthday-song.mp3",
    title: "[SONG TITLE]",
    artist: "[ARTIST]",
    artwork: "assets/music/cover.jpg"   // square image; optional
  },

  /* ---------- 🫙 Things That Make You, You ---------- */
  aboutHer: {
    title: "Things That Make You, You",
    subtitle: "Tap a note to unfold it.",
    cards: [
      { icon: "🍓", title: "Favorite things", items: ["Debating with me", "Dosa", "Crying"] },
      { icon: "🌙", title: "Little habits", items: ["Not listening to me", "Spilling Tea" ] },
      { icon: "💛", title: "Things she loves", items: ["Meee😋", "Her Family", "Cooking delicious food(i never tasted)"] },
      { icon: "♾️", title: "Why we should stay together", items: ["We love each other", "I know all your secrets", "For better future"] },
      { icon: "🌿", title: "Her strengths", items: ["Dedication", "Fighting for wrong"] },
      { icon: "✨", title: "What makes her special", items: ["Her Cutness", "HerPresence"] }
    ]
  },

  /* ---------- 🎁 Gift box ----------
     Put your photo at assets/gift/gift-photo.jpg
     (any shape works: portrait, landscape or square). */
  gift: {
    title: "Your gift 🎁",
    message: "You won't be able to celebrate your birthday, so i created a scene of you celebrating your birthday.",
    photo: "assets/gift/gift-photo.jpg",
    photoAlt: "[DESCRIBE THE PHOTO]",
    photoCaption: "Hope you like it",
    starMapNote: "Something else fell out of the box: a little star map. The window is open now.",
    goLabel: "Go to the window"
  },

  /* ---------- ⭐ Mini-game ---------- */
  game: {
    title: "Catch the falling stars",
    instructions: "Tap the stars as they drift down. No rush, missed stars just come back.",
    target: 12,            // stars needed to win
    spawnEveryMs: 850,     // how often a new star appears
    goldenChance: 0.12,    // chance a star is golden (worth 2)
    speed: 1,              // 0.7 = slower, 1.3 = faster
    winTitle: "You did it ✨",
    winText: "The last star is yours. Something just unlocked in your room."
  },

  /* ---------- 🔐 Final room ----------
     The video is the centrepiece. Put it at assets/final/final-video.mp4.
     If the video is missing, the photo is shown instead. */
  final: {
    lines: ["Okay…", "One last thing."],
    heading: "Happiest 17th, Goluuu ❤️",
    message: [
      "I Love You Sooooooo Muchhhhhh.",
      
    ],
    videoTitle: "One more thing, press play",
    video: "assets/final/final-video.mp4",
    poster: "assets/final/final-poster.jpg",  // optional
    photo: "assets/final/final-photo.jpg",    // fallback if no video
    photoAlt: "[DESCRIBE THE FINAL PHOTO]",
    signoff: "Always yours, {from}"
  },

  /* ---------- 👀 Secrets (easter eggs) ---------- */
  secrets: {
    plushie:      { title: "You found a secret 👀", text: "[SECRET MESSAGE 1 — tapping the bunny five times]" },
    shootingStar: { title: "You caught a shooting star 🌠", text: "[SECRET MESSAGE 2 — make a second wish]" },
    rug:          { title: "Tiny sparkle, tiny secret ✦", text: "[SECRET MESSAGE 3 — something small and sweet]" },
    cake:         { title: "Extra wish unlocked 🎂", text: "[SECRET MESSAGE 4 — holding the cake after wishing]" },
    typedName:    { title: "You typed your own name 💫", text: "[SECRET MESSAGE 5 — for keyboard explorers]" }
  },

  /* ---------- 🔊 Sound effects (optional files) ---------- */
  sounds: {
    click: "assets/audio/click.mp3",
    sparkle: "assets/audio/sparkle.mp3",
    unlock: "assets/audio/unlock.mp3",
    celebration: "assets/audio/celebration.mp3"
  },

  /* ---------- 🎨 Colors (optional overrides) ----------
     Leave empty to keep the designed palette. Example:
     colors: { "--peach": "#F4B69C", "--periwinkle": "#8E9BE0" } */
  colors: {}
};
