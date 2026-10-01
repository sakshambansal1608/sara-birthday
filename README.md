# Birthday Quest

A small interactive birthday world: a cozy room at dusk, five things to discover, a gift that unlocks, a star-catching game, and a final room with your message and video.

## 1. Make it hers (10 minutes)

Open `js/data.js` in any text editor (Notepad, TextEdit, VS Code). Everything you need to change is there:

- `name` and `fromName`: her name and yours.
- `letter`: the welcome note in the envelope.
- `photos`: file names, captions, dates, and a short description of each photo (the description is read aloud by screen readers).
- `music`: song file, title, artist, cover art.
- `aboutHer`: the six notes in the jar. Replace every `[BRACKETED]` placeholder.
- `gift`: what the real gift is, plus the photo inside the box (caption and description).
- `final`: your birthday message (one string per paragraph), the video, the sign-off.
- `secrets`: the five hidden messages.
- `game`: how many stars to catch and how fast they fall.

Search the file for `[` to make sure no placeholder is left.

## 2. Add your files

Each folder in `assets/` has a `PUT-FILES-HERE.txt` listing the exact names.

| What | Where |
|---|---|
| Final video (the big moment) | `assets/final/final-video.mp4` |
| Still frame before it plays (optional) | `assets/final/final-poster.jpg` |
| Backup photo if there is no video | `assets/final/final-photo.jpg` |
| Photo inside the gift | `assets/gift/gift-photo.jpg` |
| Photos | `assets/photos/photo1.jpg` … `photo6.jpg` |
| Song | `assets/music/birthday-song.mp3` |
| Sound effects (optional) | `assets/audio/click.mp3`, `sparkle.mp3`, `unlock.mp3`, `celebration.mp3` |

About the video:
- Use **MP4 (H.264)**. That plays on every iPhone and Android. Videos straight from an iPhone are sometimes `.mov`/HEVC; convert them to MP4 first (HandBrake, or any free online converter).
- Vertical or horizontal both work. The player sizes itself to the video.
- Keep it under about 50 MB so it starts quickly on mobile data.
- The video plays with sound when she presses play, and your background song fades out automatically.

Missing files never break anything: photos show a soft placeholder, sounds fall back to built-in tones, videos show a "video goes here" card.

## 3. Test it

- Double-click `index.html` to open it in your browser. It works straight from your computer.
- Add `?dev` to the address (for example `index.html?dev`) to get a test bar: unlock everything, jump to the game, jump to the finale, reset.
- On a computer, test phone sizes with your browser's device toolbar (Chrome: F12, then the phone icon).

Progress is not saved: refreshing the page starts the whole quest fresh from the intro.

**Updated a file but still see the old version?** Your browser cached it. Press Ctrl+Shift+R (Cmd+Shift+R on Mac), or on a phone close the tab and open the link again. After re-uploading to Netlify, bump the `?v=` number on the css/js links in `index.html` (for example `?v=3` → `?v=4`) so phones fetch the new files.

## 4. Put it online and send her a link (free)

Easiest, **Netlify Drop**:
1. Go to app.netlify.com/drop.
2. Drag the whole `birthday-website` folder onto the page.
3. You get a link. In the site settings you can rename it (for example `her-name-birthday.netlify.app`).

Alternative, **GitHub Pages**: create a repository, upload the folder's contents, then Settings → Pages → deploy from the main branch.

Once it's online, open the link on your own phone first and go through the whole thing.

## 5. The journey (so you know what she'll see)

1. Intro: a sparkle draws itself, "Preparing something special…", "Ready?", then **Enter**.
2. The room. The bunny says hi and points at the letter.
3. Five discoveries, each lights a star in the corner: letter, cake wish (press and hold), scrapbook, song, a note from the jar.
4. All five lit, the gift unlocks. Opening it reveals your gift message and your photo, and opens the window.
5. The window: catch 12 falling stars. That lights the sixth star.
6. The mystery box unlocks: the final room. Her constellation connects, "Okay…", "One last thing.", then your message and video, and a gentle celebration.

If she's ever unsure what to do, tapping the bunny gives a hint, and tapping the star counter shows the whole quest list. After 12 seconds of doing nothing, the next object glows.

**Secrets** (optional, don't block anything): tap the bunny five times, tap the shooting star that sometimes crosses the window, find the tiny sparkle on the rug, hold the cake after wishing, type her name on a keyboard.

## 6. Changing the look

- Colors: add overrides in `colors` in `data.js`, e.g. `colors: { "--butter": "#F5C86B" }`. All color names are at the top of `css/style.css`.
- Fonts: loaded from Google Fonts in `index.html` (Fraunces, Manrope, Caveat).
- Drawings: all objects are hand-built SVGs in `js/art.js`.

## Project structure

```
index.html            page structure and panel templates
css/style.css         design tokens, components, scenes
css/animations.css    idle motion, keyframes, reduced-motion rules
css/responsive.css    phone / tablet / desktop layouts
js/data.js            ← all your content
js/utils.js           small shared helpers
js/state.js           progress, unlocks, secrets, saving
js/art.js             the SVG illustrations
js/audio.js           sound effects, music player, mute
js/particles.js       sparkles, fireworks, hearts
js/ui.js              scenes, panels, toasts, tooltip, video player
js/intro.js           opening sequence
js/interactions.js    room objects, hints, cake, gift, notes, secrets
js/gallery.js         scrapbook and photo viewer
js/game.js            falling-stars game
js/final.js           final room
js/main.js            startup and wiring
```

No build step and no outside libraries. Animations use the browser's built-in animation system, so everything works offline too (except the Google Fonts, which fall back to system fonts).

Accessibility: fully keyboard-navigable, visible focus rings, screen-reader labels on every object, and if her phone is set to reduce motion, animations are toned right down.
