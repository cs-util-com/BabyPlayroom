### Baby Tummy-Time Motivator – Developer Specification (v 1.0)

---

## 1  Overview

A lightweight **landscape-only web game** that sits just beyond an infant’s reach, enticing the baby to roll over and tap moving animal icons.

* **Age range:** 6 – 18 months
* **Session goal:** brief, parent-supervised play (≤ 10 min) with low visual/auditory load
* **Core loop:**

  1. Every 10 s the app checks whether < 10 animals are on screen; if so, spawns one.
  2. Animals drift in a gentle random walk and wrap when they cross a screen edge.
  3. Tapping an animal plays its tap sound, triggers a random despawn effect, and removes it; the next 10 s tick may spawn a replacement.

---

## 2  Functional Requirements

| Area                         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spawn logic**              | • 10 s interval timer (`setInterval`) checks `activeAnimals < 10`; spawns 1 new animal if true.<br>• Spawn immediately if an animal despawns and the 10 s window hasn’t yet produced a replacement.                                                                                                                                                                                                                                                                     |
| **Animal data**              | Hard-coded, easily extendable array of **`PromptItem`** objects:<br>`{ emoji, soundAppear?, soundTap?, effectId }`<br>10 starter items (see §4).                                                                                                                                                                                                                                                                                                                        |
| **Motion**                   | • Pure-CSS `@keyframes drift` (6–8 s cycle) translates each sprite by small deltas stored in CSS vars (`--dx`, `--dy`) set at spawn.<br>• `animation-direction: alternate; animation-timing-function: ease-in-out;`<br>• On each keyframe cycle end, JS rewrites `--dx/--dy` to new random values, creating an organic random walk.<br>• When a translate would push the element fully past an edge, JS instantly re-positions it to the opposite side (“wrap-around”). |
| **Size & position**          | Random size 60 – 120 px (apply `width`/`height` inline). Random initial `left/top` within viewport padding (≥ 10 px).                                                                                                                                                                                                                                                                                                                                                   |
| **Effects**                  | Despawn effect chosen *randomly* from the 10-ID list (`fade_out`, `sparkle_burst`, …). Each effect implemented with CSS keyframes + optional helper elements (e.g., sparkles). Max duration 1 s.                                                                                                                                                                                                                                                                        |
| **Audio**                    | • **Howler.js** (import from CDN).<br>• Each animal may have `soundAppear` (auto-play on spawn) and/or `soundTap` (play on touch).<br>• Use `html5:true` in Howler options to force `<audio>` element playback, bypassing BBC CORS limitations.<br>• Global gain node managed by the volume slider (default = 70 %).                                                                                                                                                    |
| **Background**               | Body has a `repeating-linear-gradient` stripe using two pastel CSS custom-props `--bg1/--bg2`.<br>On every spawn tick **`applyRandomBackground()`** selects two distinct hexes from a 10-colour pastel list and updates the vars.                                                                                                                                                                                                                                       |
| **Orientation & fullscreen** | • On first parent gesture, call `requestFullscreen()` then `screen.orientation.lock('landscape')` (catch promise rejections).<br>• If lock fails, display a small toast advising manual rotation.                                                                                                                                                                                                                                                                       |
| **Parent escape**            | • 24 px translucent **X icon** in top-right corner (`pointer-events:auto; opacity:0.6`).<br>• When tapped, dim overlay appears and an **unlock badge** (padlock outline) fades in at **top-right**.<br>• Parent swipes anywhere; if pointer crosses badge’s hitbox within 3 s, show **Settings Panel** (else auto-resume).                                                                                                                                              |
| **Settings panel**           | Centered overlay (min-width 280 px) containing:<br>• **Volume slider** (range 0 – 100).<br>• **Session buttons**: 3 / 5 / 10 min (highlight current).<br>Panel closes on “Resume” or outside-tap.<br>Default auto-pause at **10 min** if panel never opened.                                                                                                                                                                                                            |
| **PWA (light)**              | • Service Worker generated by Workbox (`workbox-sw` via self-hosted file).<br>• Pre-cache: `index.html`, `app.js`, `styles.css`, OpenMoji WOFF2, Howler.js.<br>• Runtime cache strategy: `staleWhileRevalidate` for BBC MP3 URLs (first play downloads, then served from cache).<br>• Manifest.json for install prompt; display = `standalone`, orientation = `landscape`.                                                                                              |
| **Accessibility**            | • All interactive elements ≥ 44 × 44 px.<br>• `role="slider"` with `aria-valuenow`; `aria-pressed` on session buttons.<br>• Animations respect `prefers-reduced-motion: reduce` → fall back to slower fade.                                                                                                                                                                                                                                                             |
| **Safety**                   | • All sounds normalised to peak –6 dB; master volume capped at 100 %.<br>• Visually no flashing > 3 Hz; motion speed < 5°/s (≈ 1 vw/s).                                                                                                                                                                                                                                                                                                                                 |

---

## 3  Tech Stack & File Layout

```
/public
  index.html
  styles.css
  app.js
  sounds.js          // animal manifest (see §4)
  sw.js              // Service Worker (Workbox build)
  /assets/openmoji   // WOFF2 subset or CDN link
```

| Purpose        | Choice / Rationale                                                   |
| -------------- | -------------------------------------------------------------------- |
| Framework      | **None** (plain HTML + vanilla JS) – quickest load, no build step.   |
| Audio          | **Howler.js** (CDN) – cross-browser quirks handled, small footprint. |
| Animation      | CSS keyframes – zero dependencies, GPU-accelerated.                  |
| Storage        | Runtime arrays only (no backend).                                    |
| Installability | Service Worker + Web App Manifest (PWA “light”).                     |

---

## 4  Starter Animal Manifest (`sounds.js`)

```javascript
export const animals = [
  {
    emoji: "🐱",               // U+1F431
    soundAppear: "https://.../01011751.mp3", // cat purr
    soundTap:   "https://.../01011754.mp3",  // cat meow
    effectId: null            // effect chosen at runtime
  },
  {
    emoji: "🐶",
    soundAppear: "https://.../01003046.mp3",
    soundTap:   "https://.../01003039.mp3",
    effectId: null
  },
  // … full list up to 10 (sheep, cow, bird, chick, duck, frog, rabbit, penguin)
];
export const EFFECT_IDS = [
  "fade_out","shrink_fade","sparkle_burst","confetti_pop",
  "bounce_drop","particle_dissolve","pulse_glow",
  "wiggle_spin","slide_away","star_trail"
];
```

`spawnAnimal()` picks a random unused animal (or random row with duplicates allowed), injects `<span class="animal" …>` into the DOM, assigns a random `effectId`, size, position, and motion CSS vars, then plays `soundAppear` via Howler.

---

## 5  Data Flow & Modules

```
app.js
├─ preload()           // preload font, init Howler, register SW
├─ startSession()      // sets session timer, starts spawn loop
├─ spawnLoop()         // 10 s interval → maybe spawnAnimal()
│   └─ spawnAnimal()
├─ handleTap(evt)      // plays tap sound, runs effect, removes elem
├─ applyRandomBackground()
├─ showSettings() / hideSettings()
├─ setVolume(value)
└─ Service Worker messaging (for update available toast)
```

---

## 6  Error Handling

| Scenario                                 | Strategy                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| **Audio file 404 / network fail**        | Howler `onloaderror → fallbackSilent()`; animal still spawns silently.                 |
| **Fullscreen / orientation lock denied** | Show non-blocking toast, continue in windowed mode.                                    |
| **Service Worker update**                | PostMessage → toast “Update ready, tap X then Refresh”.                                |
| **prefers-reduced-motion**               | Replace motion keyframes with simple fade; disable sparkle/confetti particle elements. |
| **Offline first load**                   | Display “Connect to the internet once to download assets” splash; SW handles rest.     |

---

## 7  Testing Plan

| Level             | Tests                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**          | spawn loop timing, random size/position boundaries, wrap-around logic, effect selector uniformity.                                                                    |
| **Integration**   | • Tap on animal triggers correct sound & effect.<br>• Settings panel: slider ↔ volume, button ↔ session length.<br>• Session auto-pause at 10 min, resumes correctly. |
| **Accessibility** | Keyboard navigation of settings, ARIA roles via axe-core; colour-contrast ratio ≥ 4.5:1.                                                                              |
| **Performance**   | Chrome DevTools: ≤ 1 ms scripting per frame with 10 animals on mid-tier Android tablet.                                                                               |
| **Offline/PWA**   | Lighthouse PWA audit (≥ 90); airplane-mode check after first visit.                                                                                                   |
| **Cross-device**  | Test on iPadOS Safari, Android Chrome, Edge on Windows tablet.                                                                                                        |

---

## 8  Future-Proof Hooks

* **Add/Remove animals** – just push new objects into `animals[]`.
* **New effects** – append ID + CSS keyframes, no JS change.
* **Commercial release** – swap BBC URLs for paid SFX, update licence credits.
* **Framework migration** – vanilla structure keeps DOM clean for potential future React port.

---

### Ready to Build!

This spec contains every decision we captured—graphic assets, sound handling, motion, orientation, parent controls, light PWA caching, data structures, and a clear testing checklist. A developer can clone a blank repo, drop the file layout above, and begin coding immediately.
