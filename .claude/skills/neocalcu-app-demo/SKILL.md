---
name: neocalcu-app-demo
description: Make a short vertical (Reels/TikTok) demo video of a real NeoCalcu flow using HyperFrames, built from actual captured screenshots of the running app (never a mockup). Use whenever the user asks for a NeoCalcu promo/demo/tutorial video showing a specific feature or flow.
---

# NeoCalcu app-demo video

Recipe for building a 10–20s vertical (1080×1920, 30fps) HyperFrames video that shows a real NeoCalcu flow end to end (e.g. "enter a patient, calculate a dopamine drip"), using real captured screenshots of the app — never hand-drawn UI. Distilled from building `dopamina-15s.mp4`.

Read the `hyperframes` skill first for the general contract (`.clip`, timing, `window.__timelines`, lint/check). This skill covers what's specific to NeoCalcu demo videos.

## 1. Capture the real screens

**Always use the paid/premium version** — never the freemium UI (banners, "Suscriptores" locks, donation toasts). Set this in the browser console before capturing anything:

```js
localStorage.clear();
localStorage.setItem('disclaimerAccepted', '1');
localStorage.setItem('neo_onboarding_done', '1');
localStorage.setItem('neo_onboarding_medicamentos', '1');
localStorage.setItem('neo_onboarding_procedimientos', '1');
localStorage.setItem('neo_onboarding_calculadoras', '1');
localStorage.setItem('neo_onboarding_laboratorio', '1');
localStorage.setItem('neo_onboarding_favoritos', '1');
localStorage.setItem('neo_open_count', '1');
localStorage.setItem('neo_donated_at', Date.now().toString());
localStorage.setItem('neo_donated_plan', 'mensual');
localStorage.setItem('neo_donated_duration_ms', (30*24*60*60*1000).toString());
localStorage.setItem('neo_email_registered', '1');
location.reload();
```

- Start the real dev server (`preview_start` with name `dev`), set the Browser pane viewport to **390×844** (`resize_window width:390 height:844` — stay under Tailwind's `sm:` 640px breakpoint so the real mobile layout renders, not desktop).
- Use `read_page`/`find` to get element `ref`s and click/type on those — don't eyeball pixel coordinates from the screenshot shown in chat (it's rendered at ~2× scale; coordinates must be in the real 390×844 frame, not the displayed image size).
- **Screenshots lag one call behind.** After every click/type, call `computer{action:"screenshot"}` twice and keep the second one — the first is reliably stale.
- Use `form_input` to set `<input type="range">` sliders to an exact value (e.g. a dose) rather than dragging — precise and reliable.
- Save each kept screenshot immediately via `cp` from its `tool-results/.../blob-*.jpg` path into the project's `assets/shots/` with a descriptive name.

### Typing it digit-by-digit / letter-by-letter

If the user wants a field to look like someone is actually typing (not a single before/after jump), **capture one real screenshot per keystroke** — type one character, screenshot, save; repeat. For an 8-letter search this is 8 screenshots. This keeps every frame real captured UI, never a synthesized overlay font.

## 2. Project structure (HyperFrames)

```
npx hyperframes init <name>
```

One sub-composition per beat (`compositions/<beat>.html`), mounted from the root `index.html` via `data-composition-src`. Canvas `data-width="1080" data-height="1920"`, 15s total is a good length for a feature walkthrough with a hook + payoff + CTA.

### The "full-frame" gotcha

**Root children with `data-start` get auto-laid-out full-frame by the runtime — this overrides any CSS flex/position you give them.** This only bites when a scene (or the top root) has **multiple sibling `.clip` elements** at the top level: each gets forced full-frame and they collide/overlap unpredictably, ignoring your layout.

**Fix:** always wrap a scene's content in exactly **one** top-level `.clip` (`data-start`/`data-duration` on it only), and do everything else — multiple images, crossfades, flipbooks — as **plain (non-`.clip`) children inside it**, laid out with CSS Grid:

```css
#stage { display: grid; place-items: center; } /* the single .clip */
#layer-a, #layer-b { grid-area: 1 / 1; }         /* stacked, both centered */
```

This is the one pattern reused for every scene type below.

### Phone-mockup scene (static screenshot)

```html
<div id="root" data-composition-id="<id>" data-width="1080" data-height="1920">
  <div id="phone-wrap" class="clip" data-start="0" data-duration="<dur>" data-track-index="0">
    <img src="assets/shots/<file>.jpg" alt="" />
  </div>
</div>
```
CSS: `#phone-wrap { width: 831.75px; height: 1800px; border-radius: 48px; overflow: hidden; box-shadow: 0 40px 120px rgba(0,0,0,.55); }` (an 831.75×1800 box preserves a 390×844 screenshot's aspect ratio at a crisp display size, pillarboxed on the 1080-wide canvas). `img { width/height:100%; object-fit:cover; }`. Entrance: `fromTo(opacity 0→1, scale 0.94→1, 0.15–0.25s)`, optional slow Ken-Burns `scale 1→1.04` for the hold.

### Flipbook scene (digit/letter-by-digit typing)

One `.clip` wrapper, N stacked `<img>` frames (one per keystroke), toggle opacity with **instant `tl.set()`, never a tweened fade** — real typing has no cross-dissolve between characters:

```js
const frames = ["#f1","#f2","#f3","#f4"];
frames.forEach((sel, i) => {
  const t = i * STEP; // e.g. 0.4s/digit, 0.2s/letter
  if (i > 0) tl.set(frames[i-1], { opacity: 0 }, t);
  tl.set(sel, { opacity: 1 }, t);
});
```
Give every frame but the first `opacity:0` in CSS as a baseline (matches the proven crossfade pattern below). Pace: **~0.4s/digit** for a short numeric field (readable, still reads as "typing"), **~0.2s/letter** for a longer word (brisk but followable). Reuse the scene's existing time budget — no need to retime the rest of the video.

### Hero close-up (push into a result)

**Don't try to zoom with a live GSAP `scale`+`y` transform on the full screenshot — it produced a reproducible, never-fully-diagnosed horizontal mis-crop** (the math checks out on paper; the actual render doesn't match). Instead: **pre-crop the result region into its own asset with PIL**, and crossfade to it:

```python
from PIL import Image
im = Image.open('full-screenshot.jpg')
crop = im.crop((left, top, right, bottom))   # get the real box via getBoundingClientRect() in the live app first
crop.resize((round(crop.width*2.8), round(crop.height*2.8)), Image.LANCZOS).save('result-crop.jpg', quality=92)
```
Then two stacked layers in the single-`.clip`-wrapper pattern: `#phone-wrap` (full view, fades out) and `#crop-wrap` (opacity:0 → 1, scale 0.92→1) crossfading at the same timestamp. This is simpler, 100% predictable, and still real captured UI (just pre-cropped instead of live-cropped).

To find the exact crop box: with the real state open in the browser, run in `javascript_tool`:
```js
const card = [...document.querySelectorAll('div')].find(el => el.textContent.includes('<marker text>') && el.offsetHeight < 400);
card.getBoundingClientRect(); // x, y, width, height in the 390-wide capture
```

## 3. Sound

Use the `media-use` skill's bundled offline SFX library (no network, no licensing to track): `npx hyperframes media-use resolve --type sfx --intent "<name>" --project . --local-only`. Copy into `assets/sfx/` with a descriptive name.

**What worked for this app's UI-demo style:**
| Moment | Sound | Volume |
|---|---|---|
| Hook / payoff slam | `impact-bass-1` | 0.8 |
| Each keystroke (typing) | `key-press` | 0.45–0.6 |
| Opening a modal/result (tap) | `click` | 0.65–0.7 |
| Push-in / crossfade to the hero result | `whoosh-short` | 0.75–0.8 |
| CTA logo pop-in | `pop` | 0.7 |

`click` and `click-soft` are **byte-identical** in the bundled library — don't bother picking between them.

**Critical gotcha: truncate every repeated SFX with `data-duration`.** A sound like `key-press` is ~0.4s long, but you're often triggering it every 0.2–0.4s — without an explicit `data-duration` shorter than the gap, each instance plays its full natural length and they **pile up into a muddy blob** (`hyperframes check` catches this as `duplicate_audio_track`, a lint warning, not an error — don't ignore it). Set `data-duration` to just under the interval between triggers (e.g. `0.38` for a 0.4s gap, `0.18` for a 0.2s gap). The one exception: a long decaying hit (`impact-bass-1` on the hook) is meant to bleed into the next scene (a J-cut) — leave that one untruncated.

```html
<audio id="k1" class="clip" data-start="0" data-duration="0.38" data-track-index="1" data-volume="0.6" src="assets/sfx/key-press.mp3"></audio>
```

## 4. The hook (first 0.5s)

Reels/TikTok viewers decide to keep watching in under a second. Don't open on the flattest beat (e.g. an empty input field). Open on a **0.3–0.5s flash of the payoff** (the pre-cropped hero result, scaled in fast with `power4.out`) paired with the `impact-bass-1` hit, *then* cut to the real start of the flow. It costs nothing to budget (steal 0.5s from the following static intro hold) and it's the single highest-leverage beat in the video.

## 5. Validate before rendering

```bash
npx hyperframes check --json          # lint + runtime + layout + audio, must be 0 errors
npx hyperframes snapshot --at <times> # contact sheet — actually look at it before rendering
npx hyperframes render -o out.mp4
ffprobe -v error -show_entries stream=codec_type,codec_name out.mp4   # confirm an audio track exists
```
A `layout` error (not warning) is real — trust it over your own transform math (see the hero close-up gotcha above). A `nested_media_start_basis_ambiguous` lint warning on a sub-composition's `<audio data-start>` is expected/harmless when the value is genuinely meant as local time — ship with it.

## 6. Timeline shape that worked (15s, 7 beats)

Hook (0.5s) → empty state (1.0–1.5s) → input typed digit-by-digit (~0.2–0.6s/char) → saved confirmation (~1s) → search typed letter-by-letter → result opened (~1.2s) → **hero payoff, push-in, longest hold (4–5s)** → CTA with real app icon + wordmark (2s). The payoff beat should be the longest single hold in the video — it's the proof, give it room.
