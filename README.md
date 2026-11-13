# animation-test

Working reference demos for scroll animation on a static portfolio site: **subtle parallax**,
**fade-in on enter**, and **page transitions**. Each effect is built more than one way so the
approaches can be compared by eye and by measurement on a real phone.

This repository is reference material for whoever builds the production site. The demos are
the deliverable. This README explains what each one is, which approach it uses, and what it
measured.

- **Live site:** _added once Netlify is connected_
- **Status:** phase 1 (scaffold, meter, baseline). Demos are added phase by phase. See [Progress](#progress).

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
| Cross-document View Transitions (`@view-transition`) | 126+ | partial (160+) | 18.2+ |

The scroll-driven column is new: Firefox only shipped it recently. Visitors on older browsers get the
resting (static) state, which is complete by design.

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

_More rows are added as each phase lands._

## Results

Every number records its source: **phone** (deployed build, real device), **emulated** (deployed
build, desktop with throttling), or **localhost** (not a measurement).

_No measurements yet._

## Progress

- [x] Phase 1: scaffold, meter, baseline, Netlify config
- [ ] Phase 2: fade-in demos
- [ ] Phase 3: parallax demos
- [ ] Phase 4: page transitions
- [ ] Phase 5: measurement pass on the deployed build
- [ ] Phase 6: choice and handoff summary

## Repository layout

```
netlify.toml        Netlify publishes /site; no build command
package.json        npm scripts only; no dependencies
site/
  index.html        lists every demo
  baseline.html     control page: same content, no motion
  shared/
    base.css        shared tokens and layout; nothing in it animates
    hud-loader.js   loads the meter only when switched on
    hud.js          the performance meter
tools/
  serve.mjs         dependency-free local server
  size.mjs          gzip JS weight per page, against budgets
```
