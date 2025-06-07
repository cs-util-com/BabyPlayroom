## 1 Purpose & Scope

Create a landscape-only, fullscreen **tummy-time motivator** for babies 6–18 months. Up to ten friendly animal icons drift around the screen; when the baby taps one, it plays a matching sound and disappears with a gentle visual flourish. The activity auto-pauses after ten minutes, in line with American Academy of Pediatrics guidance to keep shared screen sessions brief for this age group ([publications.aap.org][1], [aap.org][2]).

---

## 2 Core Behaviour

| Phase               | What happens                                                                                                                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spawn loop**      | Every 10 s the app checks: if fewer than 10 animals are visible, spawn one new animal.                                                                                                                                                                                                    |
| **Movement**        | All animals move continuously in a calm, “organic random-walk” pattern and **wrap to the opposite edge** if they leave the viewport. The exact movement algorithm is up to the developer, provided motion remains smooth and does not exceed 5 °/s (infant visual-tracking comfort zone). |
| **Tap interaction** | Tapping an animal:<br>1. Plays its *tap sound* (if defined).<br>2. Triggers one random effect from the fixed list in § 4.3.<br>3. Removes the animal from the screen.                                                                                                                     |
| **Session timer**   | The game auto-pauses and shows the parent menu after 10 minutes of cumulative play. Parents can change this to 3 or 5 minutes in the menu.                                                                                                                                                |

---

## 3 Technical Requirements (developer-choice except where noted)

| Topic                | Requirement                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orientation**      | Lock to **landscape** after the first parent gesture using the standard ScreenOrientation API ([developer.mozilla.org][3], [developer.mozilla.org][4]).                                                                          |
| **Fullscreen entry** | Enter browser fullscreen as early as permitted by user-gesture rules.                                                                                                                                                            |
| **Audio engine**     | May be any library or native API; **must** support simultaneous playback of short WAV files and provide a master volume the parent slider can adjust. (Howler.js is one lightweight option) ([jsdelivr.com][5], [cdnjs.com][6]). |
| **Installability**   | Implement as a “light PWA”: pre-cache core HTML/CSS/JS and the OpenMoji font; stream BBC sounds on demand and cache them after first use.                                                                                        |
| **Framework**        | Pure HTML/JS is acceptable; teams may adopt a bundler or framework if desired, provided runtime size stays mobile-friendly (< 150 kB gzipped excluding fonts & sounds).                                                          |

---

## 4 Fixed Asset Catalogue (must not be changed without stakeholder approval)

### 4.1 Image Assets – OpenMoji glyphs

Use the **OpenMoji Color COLR/CPAL web-font** (current release on GitHub) ([github.com][7], [github.com][8]).
Each entry below *must* be represented by its Unicode code point:

| #  | Animal  | Code point |
| -- | ------- | ---------- |
| 1  | Cat     | `U+1F431`  |
| 2  | Dog     | `U+1F436`  |
| 3  | Sheep   | `U+1F411`  |
| 4  | Cow     | `U+1F404`  |
| 5  | Bird    | `U+1F426`  |
| 6  | Chick   | `U+1F424`  |
| 7  | Duck    | `U+1F986`  |
| 8  | Frog    | `U+1F438`  |
| 9  | Rabbit  | `U+1F430`  |
| 10 | Penguin | `U+1F427`  |

Icons must be rendered at a random size **between 60 px and 120 px** on spawn.

### 4.2 Audio Assets – Openverse Audio

Sounds will be sourced from Openverse.

**Licensing note:** Ensure compliance with the licensing terms of each individual audio file obtained from Openverse.

### 4.3 Tap-Despawn Effect IDs

The app must randomly pick one of these ten effect IDs at tap time; the visual execution is up to the developer as long as each runs ≤ 1 s and stays gentle (no flashes > 3 Hz):

`fade_out`, `shrink_fade`, `sparkle_burst`, `confetti_pop`, `bounce_drop`, `particle_dissolve`, `pulse_glow`, `wiggle_spin`, `slide_away`, `star_trail`.

---

## 5 Parent Controls & UI

| Element            | Behaviour                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Escape icon**    | 24 px translucent **“X”** at top-right. Tapping it reveals a dim overlay with a visible **padlock target**. Swiping any direction so the pointer crosses the padlock within 3 s unlocks the centred **settings panel**. |
| **Settings panel** | Single view containing:<br>• A horizontal master-volume slider (0–100 %).<br>• Three buttons: **3 min / 5 min / 10 min** session length (selected one highlights).                                                      |
| **Resume**         | Closing the panel resumes the spawn loop where it left off.                                                                                                                                                             |

All touch targets must be ≥ 44 × 44 px for accessibility compliance ([developer.mozilla.org][12]).

---

## 6 Accessibility & Infant-Safety Requirements

* **Audio safety:** Waveforms must be pre-normalised so that playback on typical tablet speakers does not exceed \~60 dB SPL at 30 cm distance.
* **Visual safety:** No element may flash faster than 3 times per second; background patterns must remain low-contrast pastels.
* **Reduced motion:** If the device signals `prefers-reduced-motion`, suspend drifting and effects, leaving only gentle opacity changes.
* **ARIA roles:** All interactive widgets must expose appropriate ARIA attributes (slider, buttons).

---

## 7 Testing & Acceptance Criteria

* **Asset integrity:** All ten OpenMoji glyphs render correctly at three random sizes within 60–120 px.
* **Audio mapping:** Each appear/tap event triggers the exact WAV file assigned in § 4.2; verified by logging URL before playback.
* **Spawn rule:** With the loop running, the screen never exceeds ten simultaneous animals.
* **Edge wrap:** An animal exiting the viewport must re-enter from the opposite side with no visible jump.
* **Timer:** Default 10 min pause fires within ±5 s tolerance.
* **Offline retry:** After one fully online session, reloading the app in flight-mode launches successfully and plays any previously cached sounds.
* **Orientation lock:** On supported browsers, the screen stays landscape until the user manually rotates after exiting fullscreen.

---

### This document captures every fixed asset and behavioural rule; all other engineering decisions (frameworks, exact animation code, file naming, build pipeline) are intentionally left to the development team’s discretion.

[1]: https://publications.aap.org/pediatriccare/book/342/chapter/5742710/Promoting-Physical-Activity?utm_source=chatgpt.com "Promoting Physical Activity | American Academy of Pediatrics"
[2]: https://www.aap.org/en/patient-care/media-and-children/?srsltid=AfmBOoqUHpvPGldz19Y9qCLcGsuInzzSzq14w-7oqLq0QNy75-PG-XxS&utm_source=chatgpt.com "Media and Children - AAP"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock?utm_source=chatgpt.com "ScreenOrientation: lock() method - Web APIs - MDN Web Docs"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation?utm_source=chatgpt.com "Managing screen orientation - Web APIs | MDN"
[5]: https://www.jsdelivr.com/package/npm/howler?utm_source=chatgpt.com "howler CDN by jsDelivr - A CDN for npm and GitHub"
[6]: https://cdnjs.com/libraries/howler?utm_source=chatgpt.com "howler - Libraries - cdnjs - The #1 free and open source CDN built to ..."
[7]: https://github.com/hfg-gmuend/openmoji/releases?utm_source=chatgpt.com "Releases · hfg-gmuend/openmoji - GitHub"
[8]: https://github.com/hfg-gmuend/openmoji?utm_source=chatgpt.com "hfg-gmuend/openmoji: Open source emojis for designers ... - GitHub"
[9]: https://sound-effects.bbcrewind.co.uk/?utm_source=chatgpt.com "BBC Sound Effects"
[10]: https://sound-effects.bbcrewind.co.uk/licensing?utm_source=chatgpt.com "Licensing | BBC Sound Effects"
[11]: https://pitchfork.com/news/bbc-releases-over-16000-archival-sound-samples?utm_source=chatgpt.com "BBC Releases Over 16,000 Archival Sound Samples"
[12]: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation?utm_source=chatgpt.com "ScreenOrientation - Web APIs | MDN"