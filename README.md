# animation-test

Working reference demos for scroll animation on a static portfolio site: **subtle parallax**,
**fade-in on enter**, and **page transitions**. Each effect is built multiple ways for comparison.

This repository is reference material. This README explains what each one is, which approach it uses, and what it
measured.

- **Live site:** https://animation75.netlify.app/ (auto-deploys from `main`)
- **Status:** phase 4 (all demos built; not yet measured on a phone). Demos are added phase by phase. See [Progress](#progress).

---

## Ground rules every demo follows

These come from the production project's existing decisions and are not up for debate here.

| Rule | How the demos meet it |
|---|---|
| Static site, plain CSS + custom properties, no framework, no TypeScript | Hand-written HTML/CSS/JS in `site/`. No build step. |
| No WebGL, no canvas | Motion is DOM + CSS only. |
| Animate only `transform` and `opacity` | Nothing that triggers layout is ever animated. CLS is measured to prove it. |
| Read scroll/geometry at most once per frame | Hand-written loops read once, then write. No read/write interleaving. |
| Pause rAF work offscreen and in hidden tabs | IntersectionObserver gates each loop; `visibilitychange` stops it. |
| `prefers-reduced-motion: reduce` version of every effect | Each demo documents its reduced version. It must be a coherent page, not an empty one. |
| Visible resting state | Pages are authored in their final visible state. Motion is layered on only when supported and allowed. If JS never runs, the page still reads. |
| Prefer 40 lines to a package | Libraries appear only where they are the thing being compared (parallax). |

## Approaches compared

Two primary approaches are built for every effect. Two libraries are added **for parallax only**,
because that's the one effect where a library could plausibly look or perform differently.

| Approach | JS shipped | Used for |
|---|---|---|
| CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`) | none | fade-in, parallax |
| IntersectionObserver + hand-written rAF loop | a few hundred bytes | fade-in, parallax |
| Motion (vanilla) | library | parallax only |
| GSAP + ScrollTrigger | library | parallax only |

Page transitions use real multi-page navigation: no client-side router. See the transition section
(phase 4) for why, and what to change if a router is ever adopted.

## Browser support (checked 2026-11-13)

Checked against MDN browser-compat-data and caniuse on the date above. Re-check before relying on it.

| Feature | Chrome / Edge | Firefox | Safari (macOS + iOS) |
|---|---|---|---|
| Scroll-driven animations (`animation-timeline: scroll()`, `view()`) | 115+ | **159+** (current stable is 160) | **26+** |
| Cross-document View Transitions (`@view-transition`) | 126+ | **not in release** (preview builds only, checked 2026-11-15) | 18.2+ |

Firefox only recently shipped scroll-driven animations. Visitors on older browsers get the resting
(static) state, which is complete by design. Without cross-document View Transitions, links simply
change page instantly. Only T3 and T5 animate in Firefox today.

## Running it locally

Requires Node 22.12 or newer. From PowerShell, in this folder:

```powershell
npm run serve
```

Then open http://localhost:8080. Press `Ctrl+C` in PowerShell to stop.

JS weight per page (gzipped, excluding the meter):

```powershell
npm run size
```

**Localhost numbers are not measurements.** Frame rates, long tasks and layout shift are only
recorded from the deployed Netlify build on a real phone.

## How performance is measured

### Budgets

| Metric | Target | Fail |
|---|---|---|
| Motion library + orchestrator JS (gzip) | 45 KB | 60 KB |
| Total page JS (gzip) | 100 KB | 150 KB |
| Sustained frame rate, heaviest scroll sequence, **third pass** | ≥ 55 fps | < 55 fps |
| Long tasks | none > 50 ms | any > 50 ms |
| Main-thread script per frame | < 8 ms | ≥ 8 ms |
| CLS | < 0.05 | ≥ 0.05 |

### The meter

Add `?hud` to any demo URL, or switch it on from the index page. It's remembered per device; `?hud=0`
turns it off. It is tooling, excluded from JS budgets, and loaded only when switched on.

- **Live readout:** fps, worst frame, dropped frames, long tasks, CLS, and per-frame script time for demos with their own loop.
- **Auto 3×:** the thermal test. Scrolls top→bottom three times at 400 px/s and reports each pass separately. Pass 3 is the number that counts.
- **Manual 3×:** same, while you scroll by finger. Closer to real use, because scripted scrolling runs on the main thread and finger scrolling mostly doesn't.
- **Copy:** copies a plain-text report including browser, screen refresh rate, host, and date.

What each browser can report:

| Measure | Chrome / Edge | Safari / iOS | Firefox |
|---|---|---|---|
| fps, dropped frames, worst frame | yes | yes | yes |
| Long tasks | yes | **no** (not exposed to pages) | no |
| CLS | yes | **no** (not exposed to pages) | no |

So on the iPhone, long tasks and CLS are marked "n/a". They're covered instead by Chrome on desktop
with DevTools CPU throttling. That's labelled **emulated**, never "phone".

### The motion status pill

Every demo page shows a small pill in the bottom-left corner that says, in plain words, whether
that page's motion is actually running. It reports what the page *did*, not what it should do:

| Dot | Meaning |
|---|---|
| green | Running. It also says how (browser-driven scroll-linked, or page script) and the current intensity or rise. |
| grey | Off because the device's Reduce Motion setting is on, or a control page, or the tab is in the background. |
| amber | This browser doesn't support the effect, so the still version shows. |
| red | Should be running but isn't. That's a bug: note the page and browser. |

Tap it to shrink it to a dot. It moves up when the meter is open. It's tooling (`shared/status.js`,
loaded by `hud-loader.js`), excluded from JS budgets, and it never changes an animation.
On transition pages it reports whether the browser supports the transition, because nothing moves until you click.
**Remove it (one line in `hud-loader.js`) before reusing any demo in production.**

### Test devices

| Device | Role | Notes |
|---|---|---|
| iPhone 14, iOS 26.5.2, Safari | Primary real-phone measurement | 60 Hz screen. A few generations old: a fair mid-tier proxy. |
| Windows laptop, Chrome, 4× CPU throttle | Long tasks, CLS, script ms (emulated) | Labelled emulated |

Before measuring on an iPhone, **turn off Low Power Mode**: it caps Safari at 30 fps. The meter
reports the detected refresh rate, so a "30Hz" reading on an iPhone 14 means Low Power Mode was on.
Measure with the browser in the foreground. Background or hidden tabs are throttled and their numbers are meaningless.

## Demos

| Demo | Effect | Approach | Page |
|---|---|---|---|
| Baseline | none (control) | — | `site/baseline.html` |
| Fade A | fade-in on enter | CSS scroll-driven (`view()`) | `site/fade/css.html` |
| Fade B | fade-in on enter | IntersectionObserver + CSS transition | `site/fade/vanilla.html`, `vanilla.js` |
| Parallax A | subtle parallax | CSS scroll-driven (named `view-timeline`) | `site/parallax/css.html` |
| Parallax B | subtle parallax | IntersectionObserver + hand-written rAF step | `site/parallax/vanilla.html`, `vanilla.js` |
| Parallax C | subtle parallax | Motion `animate()` + `scroll()` | `site/parallax/motion.html`, `motion.js` |
| Parallax D | subtle parallax | GSAP + ScrollTrigger (`scrub: true`) | `site/parallax/gsap.html`, `gsap.js` |
| Transition T1 | crossfade | cross-document View Transitions, CSS only | `site/transitions/t1/`, `t1.css` |
| Transition T2 | shared element (header holds, image morphs) | cross-document View Transitions, CSS only | `site/transitions/t2/`, `t2.css` |
| Transition T3 | fade out → fade in | small script + CSS | `site/transitions/t3/`, `t3.css`, `t3.js` |
| Transition T4 | slide-over | cross-document View Transitions, CSS only | `site/transitions/t4/`, `t4.css` |
| Transition T5 | colour bars: cover, load, reveal | small script + CSS | `site/transitions/t5/`, `t5.css`, `t5.js` |
| Trap test | T3 + fade-in B + Back/Forward | self-checking pages | `site/transitions/trap/` |

_More rows are added as each phase lands._

### Fade-in

Both versions fade each block in with an optional small rise as it enters the viewport. There's no
stagger or choreography. Each page has controls for rise distance (fade only / 16px / 32px /
**Loud 120px, test only**), and B also has controls for duration. The controls are pure CSS (`:has()` on radio buttons).
On A, Loud also stretches the fade from 25% to 60% of a screen height of scrolling. Like parallax Loud,
it's a diagnostic for "too subtle vs not running", not a candidate.

**The two feel different, and that's the real decision here, more than performance:**

| | A · CSS scroll-driven | B · IntersectionObserver |
|---|---|---|
| Driven by | scroll position | a clock (CSS transition) |
| Stop scrolling mid-fade | stays partly faded | finishes on its own |
| Scroll back up | fades back out | stays visible (plays once) |
| JavaScript | 0 KB | ~1.1 KB gzip (mostly comments) |
| Per-frame work | none on the main thread | none (IO callbacks only, no rAF) |

**A · CSS scroll-driven** (`site/fade/css.html`)
- `animation-timeline: view()` with `animation-range: entry 0% entry 25vh`. Each block is fully
  in once its top edge is a quarter of the viewport into view, whatever the block's height.
- The hidden state exists only inside `@keyframes`, which are applied only inside
  `@media (prefers-reduced-motion: no-preference)` **and** `@supports (animation-timeline: view())`.
  Anything else gets the plain visible page. There's no script that can fail and no event to miss.
- Edge case to keep in mind: a block can only finish if its top can travel 25vh into the viewport.
  The last block on a page needs at least that much content below it. Verified on this page.
- Print: `animation: none`.

**B · IntersectionObserver** (`site/fade/vanilla.js`)
- Blocks are hidden only under `html.fade-armed`, a class only the script adds. With no script,
  nothing is hidden. Verified by loading the page with scripts stripped: all 13 blocks visible.
- On start it reads every block's position once (one read pass), marks blocks already on screen
  as revealed, *then* arms. So nothing above the fold ever blinks or fades on load.
- Threshold is 15% of the block visible (not a negative `rootMargin`). A negative bottom margin can
  make the last block on a page unreachable, so it would never reveal.
- Safety nets:
  - A watchdog reveals everything if the observer hasn't reported within 1s of the tab being
    visible. Observers always report once on `observe()`, so silence means something is broken.
  - Switching on reduced motion mid-visit reveals everything.
  - `@media print` forces everything visible.
- Only the reveal is transitioned. Hiding offscreen blocks at start is instant.

**Reduced motion (both):** everything is simply visible from the start. Nothing fades.

### Parallax

All four pages share identical markup and scene styles (`site/parallax/parallax.css`). Only the
motion code differs, so any difference you see or measure comes from the approach.

**The scene model.** Each `.px-scene` contains layers (`.px-layer`) with a speed factor `--f`:

| Layer | `--f` | Apparent speed |
|---|---|---|
| Background (soft shapes, panels, outline type) | `1` | slowest: lags behind the scroll |
| Mid-ground (image plates) | `0.5` | lags a little |
| Normal content (text) | (not a layer) | exactly finger speed: the reference |
| Foreground (chips, cards) | `-0.5` | fastest: runs slightly ahead |

Across a scene's whole trip through the viewport (top edge enters at the bottom → bottom edge
leaves at the top), each layer drifts by `intensity × --f`, centred so that **every layer is
exactly at its resting position when the scene is in the middle of the screen.** Text never moves,
so readability never depends on the effect.

**Intensities** (background drift over a full scene; mid is half, foreground half in reverse):

| Name | `--i` | URL |
|---|---|---|
| Whisper (default) | 32px | `#whisper` or no hash |
| Quiet | 64px | `#quiet` |
| Noticeable | 128px | `#noticeable` |
| Loud (**test only**) | 400px | `#loud` |

**Loud is a diagnostic, not a candidate.** It's deliberately excessive, so a tester can tell "too subtle
to notice" apart from "not running". At this size the background gets extra headroom (`inset: -210px 0`).
Mid and foreground layers move ±100px and may overlap text or clip at scene edges. That's accepted for a test.

The picker is pure CSS: the hash targets an invisible `position: fixed` element and `html:has(#quiet:target)`
switches `--i`. Links are shareable, and following one never scrolls the page. The JS versions read the
values from `--i-whisper` / `--i-quiet` / `--i-noticeable` in the CSS, so there's one source of truth.
They read those properties directly rather than `--i`, because browsers can apply `:target` slightly
after deferred scripts run.

**Resting state.** Every layer is `transform: none` until an approach moves it, and the scenes are
composed to look deliberate standing still. Reduced-motion visitors, no-JS visitors and old browsers
all get exactly that composition. Background layers extend 72px past their scene (`inset: -72px 0`)
and scenes use `overflow: clip`, so even the largest drift never reveals an edge or widens the page.
That was checked at 375px wide: no horizontal overflow.

**The four approaches, as built and checked** (local Chrome, 2026-11-13: behaviour checks only, not performance):

| | A · CSS | B · Hand-written | C · Motion | D · GSAP |
|---|---|---|---|---|
| JS shipped (gzip) | 0 | 1.6 KB | 29.6 KB (28.7 lib) | 46.4 KB (45.5 lib) |
| Library budget (45 / 60 KB) | — | — | ok | **over target**, under fail |
| Who computes each frame | browser (native view timeline) | page JS, main thread | browser: confirmed all 18 animations run on a native `ViewTimeline` | page JS, main thread |
| Work while idle (not scrolling) | none | none: a frame is requested only on scroll, and only if a scene is on screen | none | **GSAP's ticker keeps a rAF loop running**: 48 ticks in 2 idle seconds |
| Hidden tab | paused by browser | paused (rAF + explicit check) | paused by browser | paused by browser (rAF) |
| Reduced motion | never applied (`@media`) | never starts; live change clears transforms | never starts; live change reloads | `gsap.matchMedia` never builds; live change reverts |
| Older browser fallback | resting state | works (IO is universal) | Motion's own scroll listener | works |
| Matches expected geometry | yes | yes, to 0.1px | yes | yes |

Notes for whoever picks this up:
- **C is effectively A with a 29 KB wrapper** in every current browser, because Motion hands
  `transform` animations to the native scroll timeline. It only behaves differently in browsers too
  old for scroll-driven animations, where it falls back to JS. A, by contrast, falls back to stillness.
- **B and D do the same job the same way** (main-thread JS writing transforms each frame). D costs
  45 KB more and doesn't go idle. On a phone this is where any difference in *feel* should show:
  main-thread approaches can trail the finger by a frame while the page scrolls on the compositor.
  Watch for it on the iPhone, and compare with A.
- **B's rules:** scene geometry is measured only on load/resize (`ResizeObserver` on `body` catches
  late layout changes). Each frame does exactly one read (`scrollY`), then only writes. Layers in
  offscreen scenes aren't touched (IntersectionObserver with a 10% margin, so they update just before
  becoming visible).
- **`position: sticky` isn't used.** The brief listed it alongside IntersectionObserver, but sticky is
  for *pinned* scenes (content that holds still while you scroll through it). Subtle parallax doesn't pin
  anything, so adding it would only add complexity.
- D uses `scrub: true` (locked to scroll) for a fair comparison. `scrub: 0.5` adds a soft catch-up lag,
  which is a distinct feel if you want to try it.
- The intensity picker adds a browser-history entry per click (it's a hash link). Acceptable for a test
  bench, not for production.

### Page transitions

**No client-side router, on purpose.** Every link is a real page load. The known failure (a router's
soft navigation swaps the page without re-running scripts, so IntersectionObserver fade-ins never
re-arm and content stays at `opacity: 0`) can't happen when there's no soft navigation. Cross-document
View Transitions give router-style transitions between real pages.

Each option has the same four pages: `work.html` (project list) and `p1`–`p3.html` (case studies),
like a portfolio. The shared layout is `site/transitions/transitions.css`, which contains no motion.

| | T1 · Crossfade | T2 · Shared element | T3 · Scripted fade | T4 · Slide-over |
|---|---|---|---|---|
| What you see | old page dissolves into new (280ms) | header holds still; clicked image grows into the case-study hero (420ms), rest crossfades | fade out (200ms) → fade in (260ms) | new page slides up over the old, which sinks back (480ms) |
| JavaScript | 0 | 0 | 0.7 KB | 0 |
| Mechanism | `@view-transition { navigation: auto }` | same, + `view-transition-name` on header and each project image | click handler delays navigation 200ms; entrance is a CSS animation | same as T1, + custom keyframes on `::view-transition-old/new(root)` |
| Properties animated | opacity | opacity, transform, and the browser's own group size (see below) | opacity | transform, opacity |
| Back button | animates | animates in reverse (image shrinks back) | plain restore; trap handled | animates (same direction) |
| Firefox (release) | instant page change | instant page change | animates | instant page change |
| Reduced motion | 150ms crossfade | names removed, so a 150ms crossfade only | no fade, instant | 150ms crossfade |
| Cost to the visitor | none | none | **adds 200ms before the next page starts loading** | none |

Notes:
- **T2 and strictness.** To grow an image between two sizes, the browser animates the width/height of
  its own `::view-transition-group` overlay. That's not the page's layout and causes no layout shift,
  but it isn't strictly "transform and opacity only". Both images are 4:3, so it reads as a pure scale.
  If the rule must be absolute, T1 or T4 satisfy it fully.
- **Reduced motion keeps a 150ms crossfade** rather than a hard cut. Opacity changes don't move anything
  on screen, which is what triggers vestibular discomfort. Set the duration to `0s` in the reduced
  block for a pure cut.
- **T3 is the only option that works in Firefox today.** But it makes every navigation 200ms slower and
  shows a brief empty frame between pages. T1 is the same look without either cost, wherever it's supported.
- **T4's direction doesn't reverse on Back.** Reversing needs a few lines of script (a `pagereveal`
  handler setting a view-transition type). Left out to keep it CSS-only.

**T5 · Colour bars** (added 2026-11-15 at the designer's request; `t5.css`, `t5.js`, inline `<head>` script)
- **What you see:** on click, four full-width bars (red, orange, yellow, sky blue, top to bottom) rise from
  below the screen, growing from a quarter to full height. Each starts 40ms after the one above, and red has
  the furthest to go in the same time, so their speeds differ. They form a solid cover (720ms). The browser
  then navigates. The new page first paints already covered, and the bars sweep up and off the top, shrinking
  as they go (80ms hold + 720ms). Easing is `cubic-bezier(0.77, 0, 0.175, 1)` both ways.
- **How it stays seamless:** just before navigating, the old page sets a timestamp in `sessionStorage`. A
  two-line inline script in the new page's `<head>` sees it (if under 10s old), clears it, and adds
  `.t5-enter` before first paint. The browser keeps showing the covered old page until the new one paints,
  so the cover never breaks.
- **Bars are pseudo-elements** (`html::before/::after`, `body::before/::after`): no markup, and they exist from
  the first paint. Transform only (`translateY` + `scaleY`). They exist only while `.t5-leave` or `.t5-enter`
  is on `<html>`. No script means no class, so no bars.
- **Traps handled:** `pageshow` removes the cover when Back restores the page from memory. A 4s safety net
  uncovers the page if navigation never happens. The arrival class is removed after 1.5s, but the bars are
  already parked offscreen by `animation-fill-mode: both`.
- **Cost:** every navigation waits 720ms before the next page even starts loading (the next page is
  prefetched at click to claw some of that back, in Chrome). About 1.5s of motion per click in total.
  Back/Forward are plain instant changes, as in T3. 1.3 KB gzip of JavaScript, comments included.
- **Reduced motion:** no bars, instant navigation. **Firefox:** works (no View Transitions needed).
- Checked in localhost Chrome (2026-11-15), behaviour only: cover sequence, reveal sequence, Back-restore
  simulation (cover cleared), no bars at rest. Not yet seen on a phone.
- Timing lives in both `t5.css` and `t5.js` (`COVER_MS`). Keep them in step.

**T3's trap, and the trap test.** Browsers keep recently left pages frozen in memory (the back/forward
cache) and restore them exactly as left. For T3 that means faded to opacity 0. `t3.js` clears that on
`pageshow`, which fires on every show, including restores. It also has a 4-second safety net that
un-fades the page if navigation never happens. The page entrance is a CSS animation that starts on its
own and doesn't wait for any event, with `animation-fill-mode: backwards` so it never pins opacity
afterwards.

`site/transitions/trap/` combines T3 with fade-in B (the IntersectionObserver version, the one at risk)
on two long pages. `trap-check.js` (tooling, excluded from budgets) shows a PASS/FAIL badge. After
every show and every scroll it waits for fades to settle, then checks that the page isn't faded out and
that every fade-in block at least 25% on screen is fully visible. It also reports how the page was
shown: fresh load, reload, or restored from memory.

Checked locally (Chrome, 2026-11-15):
- Fresh load: PASS.
- Back after scrolling halfway and leaving: PASS. The preview browser reloaded rather than restoring from memory.
- Restore-from-memory simulated (page left faded, then `pageshow` with `persisted: true`): PASS.
  Before the event fired, the page was at opacity 0, which is the failure this guards against.
- Still to do on a real device: iPhone Safari swipe-back, which normally *does* restore from memory.

**If a client-side router is ever adopted** (e.g. Astro's `<ClientRouter />`):
1. Initialise fade-ins on the router's "page loaded" event (`astro:page-load`), not just on first load.
2. Disconnect the old observer before the swap (`astro:before-swap`).
3. Keep the rule that only the script can hide content, so a missed re-init leaves content visible
   rather than invisible.
4. Re-run the trap test.

## Results

Every number records its source: **phone** (deployed build, real device), **emulated** (deployed
build, desktop with throttling), or **localhost** (not a measurement).

### JS weight (gzip, from `npm run size`; independent of network and device)

| Page | Library | Own JS | Total | Budget |
|---|---:|---:|---:|---|
| baseline.html | 0 | 0 | 0 | ok |
| fade/css.html | 0 | 0 | 0 | ok |
| fade/vanilla.html | 0 | 1.1 KB | 1.1 KB | ok |
| parallax/css.html | 0 | 0 | 0 | ok |
| parallax/vanilla.html | 0 | 1.6 KB | 1.6 KB | ok |
| parallax/motion.html | 28.7 KB | 0.9 KB | 29.6 KB | ok |
| parallax/gsap.html | 45.5 KB | 0.9 KB | 46.4 KB | library over 45 KB target (under 60 KB fail) |

| transitions/t1, t2, t4 (all pages) | 0 | 0 | 0 | ok |
| transitions/t3 (all pages) | 0 | 0.7 KB | 0.7 KB | ok |
| transitions/t5 (all pages) | 0 | 1.3 KB | 1.3 KB | ok |
| transitions/trap/a, b | 0 | 1.8 KB | 1.8 KB | ok (T3 + fade-in B) |

All totals are far below the 100 KB page budget. Vendored library versions and licences are in `site/vendor/README.md`.

### Visual review, round 1 (designer, 2026-11-15; impressions, not measurements)

Seen on the deployed build and localhost, in Chrome on Windows desktop and Chrome on iPhone 14 (iOS 26.5.2;
Chrome on iOS uses Safari's engine).

- **Fade-in B** (IntersectionObserver) was preferred on desktop and phone. Best combination: 32px rise, 900ms.
  "Fade only" appeared to do nothing.
- **Fade-in A and parallax A** (CSS): no visible effect.
- **Parallax B, C, D:** no visible effect on desktop. "Noticeable" looked good on the iPhone.
- **Page transitions:** all visible. Crossfade felt too subtle and quick. Slide-over worked, but the designer dislikes it.
- **Trap test:** PASS on desktop and on iPhone (Netlify).

**Investigating "no effect on desktop"** (2026-11-15). Windows' Animation effects setting is on, so reduced
motion is ruled out. In localhost Chrome both CSS demos do animate. Working theory: on a 1440×900 screen a
scene takes about 1,900px of scrolling to cross, against about 1,340px on a phone. A mouse wheel also moves
in roughly 100px jumps, so a background drifting about 7px per click reads as part of the jump. The Loud
settings and the status pill were added to settle this. Next: re-review with both.

### Frame rate, long tasks, CLS

_Waiting for the Netlify deploy. No real-phone measurements yet._

## Progress

- [x] Phase 1: scaffold, meter, baseline, Netlify config
- [x] Phase 2: fade-in demos
- [x] Phase 3: parallax demos
- [x] Phase 4: page transitions
- [ ] Phase 5: measurement pass on the deployed build
- [ ] Phase 6: choice and handoff summary

## Repository layout

```
netlify.toml        Netlify publishes /site; no build command
package.json        npm scripts only; no dependencies
site/
  index.html        lists every demo
  baseline.html     control page: same content, no motion
  fade/             fade-in demos: css.html (A), vanilla.html + vanilla.js (B)
  parallax/         parallax.css (shared scene, no motion) + css / vanilla / motion / gsap pages
  transitions/      transitions.css (shared, no motion), t1–t5 styles + t3.js, t5.js,
                    one folder per option (work.html, p1–p3.html), trap/ (self-checking trap test)
  vendor/           Motion and GSAP builds, with versions and licences in vendor/README.md
  shared/
    base.css        shared tokens and layout; nothing in it animates
    hud-loader.js   loads the meter only when switched on, and the status pill always
    status.js       motion status pill (tooling: is this page's motion running?)
    hud.js          the performance meter
tools/
  serve.mjs         dependency-free local server
  size.mjs          gzip JS weight per page, against budgets
```
