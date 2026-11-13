/*
  Performance meter ("HUD") — measurement tooling, not part of any demo.

  What it measures, and where each number is available:
    fps, dropped frames, worst frame  — every browser (from requestAnimationFrame timing)
    long tasks (>50ms)                — Chrome/Edge only. Safari and Firefox don't expose them.
    layout shift (CLS)                — Chrome/Edge only. Safari and Firefox don't expose it.
    script ms per frame               — only for demos that run their own per-frame JS and
                                        report it via globalThis.__hudWork(ms). CSS-only demos: 0.

  Thermal test: "Auto 3×" scrolls top→bottom three times at a slow constant speed and
  reports each pass separately. "Manual 3×" does the same while you scroll by finger.
  Note: scripted scrolling runs through the page's main thread; finger scrolling on a
  phone mostly doesn't. Auto is repeatable; manual is closer to real use. Record both.
*/

const SPEED = 400; // px per second for auto passes — deliberately slow
const PASSES = 3;

const supports = (t) => (PerformanceObserver.supportedEntryTypes || []).includes(t);
const HAS_LT = supports('longtask');
const HAS_LS = supports('layout-shift');

// ---- state ---------------------------------------------------------------
let last = performance.now();
const recent = [];          // recent frame deltas, for estimating refresh rate
let interval = 1000 / 60;   // estimated refresh interval (ms)
let win = newBucket();      // live readout bucket
let pass = null;            // current pass bucket, or null
let results = [];
let mode = null;            // null | 'auto' | 'manual'
let manualState = 'armed';  // armed → recording → returning → armed
let autoY = 0, autoMax = 0, autoWaitUntil = 0;
let cls = 0;

function newBucket() {
  return { start: performance.now(), frames: 0, dropped: 0, worst: 0, lt: 0, ltMax: 0, work: 0, workMax: 0, workN: 0 };
}

// Demos with their own per-frame JS call this with how long their frame work took.
globalThis.__hudWork = (ms) => {
  for (const b of [win, pass]) if (b) { b.work += ms; b.workN++; if (ms > b.workMax) b.workMax = ms; }
};

if (HAS_LT) new PerformanceObserver((list) => {
  for (const e of list.getEntries()) for (const b of [win, pass]) if (b) {
    b.lt++; if (e.duration > b.ltMax) b.ltMax = e.duration;
  }
}).observe({ type: 'longtask', buffered: false });

if (HAS_LS) new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.hadRecentInput) continue;
    // Ignore shifts caused only by the meter's own panel.
    const srcs = e.sources || [];
    if (srcs.length && srcs.every((s) => s.node && el.contains(s.node))) continue;
    cls += e.value;
  }
}).observe({ type: 'layout-shift', buffered: true });

// ---- frame loop ------------------------------------------------------------
function frame(now) {
  const dt = now - last;
  last = now;

  recent.push(dt);
  if (recent.length > 120) recent.shift();
  // Estimate the screen's refresh rate while idle; freeze it during a run.
  if (!mode && recent.length >= 30) {
    const sorted = [...recent].sort((a, b) => a - b);
    const hz = 1000 / sorted[sorted.length >> 1];
    // snap to a common refresh rate
    const snapped = [30, 48, 60, 75, 90, 120, 144, 165].reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a);
    interval = 1000 / snapped;
  }

  for (const b of [win, pass]) if (b) {
    b.frames++;
    if (dt > b.worst) b.worst = dt;
    if (dt > interval * 1.5) b.dropped += Math.round(dt / interval) - 1;
  }

  if (mode === 'auto') stepAuto(now, dt);
  else if (mode === 'manual') stepManual();

  if (now - win.start >= 500) { render(); win = newBucket(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A hidden tab pauses rAF; never let that gap count as a dropped frame.
document.addEventListener('visibilitychange', () => {
  last = performance.now();
  if (document.hidden && mode) stop('Stopped: tab was hidden.');
});

// ---- passes ------------------------------------------------------------------
function maxScroll() {
  return document.documentElement.scrollHeight - innerHeight; // read once per pass
}

function startAuto() {
  results = []; mode = 'auto';
  window.scrollTo(0, 0);
  autoY = 0; autoMax = maxScroll(); pass = null;
  autoWaitUntil = performance.now() + 600;
  addEventListener('touchstart', abortAuto, { once: true, passive: true });
  addEventListener('wheel', abortAuto, { once: true, passive: true });
  status(`Auto: pass 1 of ${PASSES}…`);
}
function abortAuto() { if (mode === 'auto') stop('Stopped: you touched the page during an auto run.'); }

function stepAuto(now, dt) {
  if (now < autoWaitUntil) return;
  if (!pass) { pass = newBucket(); last = now; return; }
  autoY = Math.min(autoMax, autoY + SPEED * Math.min(dt, 100) / 1000);
  window.scrollTo(0, autoY);
  if (autoY >= autoMax) {
    endPass();
    if (results.length >= PASSES) return finish();
    window.scrollTo(0, 0); autoY = 0;
    autoWaitUntil = now + 600;
    status(`Auto: pass ${results.length + 1} of ${PASSES}…`);
  }
}

function startManual() {
  results = []; mode = 'manual'; pass = null;
  autoMax = maxScroll();
  manualState = window.scrollY < 4 ? 'armed' : 'returning';
  status(manualState === 'armed'
    ? `Manual: scroll slowly to the bottom (pass 1 of ${PASSES}).`
    : 'Manual: go back to the top first.');
}

function stepManual() {
  const y = window.scrollY; // one geometry read per frame
  if (manualState === 'armed' && y > 4) { pass = newBucket(); manualState = 'recording'; }
  else if (manualState === 'recording' && y >= autoMax - 2) {
    endPass(); manualState = 'returning';
    if (results.length >= PASSES) return finish();
    status(`Manual: back to the top, then pass ${results.length + 1} of ${PASSES}.`);
  } else if (manualState === 'returning' && y < 4) {
    manualState = 'armed'; autoMax = maxScroll();
    status(`Manual: scroll slowly to the bottom (pass ${results.length + 1} of ${PASSES}).`);
  }
}

function endPass() {
  const b = pass; pass = null;
  const secs = (performance.now() - b.start) / 1000;
  results.push({
    fps: b.frames / secs, dropped: b.dropped, worst: b.worst, secs,
    lt: b.lt, ltMax: b.ltMax,
    work: b.workN ? b.work / b.workN : 0, workMax: b.workMax,
  });
}

function stop(msg) { mode = null; pass = null; status(msg); }

function finish() {
  const how = mode; mode = null;
  const hz = Math.round(1000 / interval);
  const rows = results.map((r, i) =>
    `<tr class="${r.fps >= 55 ? 'ok' : 'bad'}"><td>${i + 1}</td><td>${r.fps.toFixed(1)}</td><td>${r.dropped}</td>` +
    `<td>${r.worst.toFixed(0)}</td><td>${HAS_LT ? `${r.lt}${r.lt ? ` (max ${r.ltMax.toFixed(0)})` : ''}` : 'n/a'}</td>` +
    `<td>${r.work.toFixed(2)} / ${r.workMax.toFixed(1)}</td></tr>`).join('');
  ui.out.innerHTML =
    `<table><tr><th>Pass</th><th>fps</th><th>Drops</th><th>Worst ms</th><th>Long tasks</th><th>Script ms avg/max</th></tr>${rows}</table>`;
  ui.out.dataset.text = report(how, hz);
  status(`Done (${how}, ${hz}Hz screen). Pass 3 is the one that counts.`);
}

function report(how, hz) {
  const lines = [
    `page: ${location.pathname}${location.search}`,
    `host: ${location.host}${/localhost|127\.0\.0\.1/.test(location.host) ? '  (LOCALHOST — not a measurement)' : ''}`,
    `date: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    `browser: ${navigator.userAgent}`,
    `screen: ${hz}Hz, ${innerWidth}x${innerHeight} css px, dpr ${devicePixelRatio}`,
    `mode: ${how}${how === 'auto' ? ` (${SPEED}px/s)` : ''}`,
    `CLS total: ${HAS_LS ? cls.toFixed(3) : 'n/a in this browser'}`,
    'pass | fps | dropped | worst ms | long tasks (max ms) | script ms avg/max',
    ...results.map((r, i) => `${i + 1} | ${r.fps.toFixed(1)} | ${r.dropped} | ${r.worst.toFixed(0)} | ` +
      `${HAS_LT ? `${r.lt} (${r.ltMax.toFixed(0)})` : 'n/a'} | ${r.work.toFixed(2)}/${r.workMax.toFixed(1)}`),
  ];
  return lines.join('\n');
}

// ---- UI ------------------------------------------------------------------------
const css = `
#hud{position:fixed;right:8px;bottom:8px;z-index:2147483647;width:min(26rem,calc(100vw - 16px));
 font:12px/1.4 ui-monospace,Consolas,Menlo,monospace;color:#f4f1ea;background:rgba(20,18,16,.88);
 border-radius:8px;padding:8px 10px;contain:content;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
#hud .live{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hud .row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
#hud button{font:inherit;color:inherit;background:#3a3631;border:0;border-radius:5px;padding:5px 8px;cursor:pointer}
#hud button:active{background:#5a5249}
#hud .st{margin-top:6px;color:#d9cfbf}
#hud table{margin-top:6px;border-collapse:collapse;font-size:11px}
#hud th,#hud td{padding:2px 6px 2px 0;border:0;text-align:right}
#hud th:first-child,#hud td:first-child{text-align:left}
#hud tr.ok td:nth-child(2){color:#8fd18f}#hud tr.bad td:nth-child(2){color:#ff8f7a}
#hud.min .row,#hud.min .st,#hud.min .out{display:none}`;
const style = document.createElement('style');
style.textContent = css;
document.head.append(style);

const el = document.createElement('div');
el.id = 'hud';
el.setAttribute('aria-hidden', 'true'); // tooling: keep it out of the accessibility tree
el.innerHTML = `<div class="live">…</div>
<div class="row"><button data-a="auto">Auto 3×</button><button data-a="manual">Manual 3×</button>
<button data-a="copy">Copy</button><button data-a="min">–</button></div>
<div class="st">Meter on. Live numbers update twice a second.</div><div class="out"></div>`;
document.body.append(el);
const ui = { live: el.querySelector('.live'), st: el.querySelector('.st'), out: el.querySelector('.out') };

el.addEventListener('click', async (e) => {
  const a = e.target.dataset?.a;
  if (a === 'auto') startAuto();
  if (a === 'manual') startManual();
  if (a === 'min') el.classList.toggle('min');
  if (a === 'copy') {
    const text = ui.out.dataset.text || 'Run Auto 3× or Manual 3× first.';
    try { await navigator.clipboard.writeText(text); status('Copied. Paste it into the chat.'); }
    catch { status('Copy blocked by the browser — screenshot the table instead.'); }
  }
});

function status(t) { ui.st.textContent = t; }

function render() {
  const secs = (performance.now() - win.start) / 1000;
  const fps = win.frames / secs;
  ui.live.textContent =
    `${fps.toFixed(0)} fps · worst ${win.worst.toFixed(0)}ms · drops ${win.dropped}` +
    ` · LT ${HAS_LT ? win.lt : 'n/a'} · CLS ${HAS_LS ? cls.toFixed(3) : 'n/a'}` +
    (win.workN ? ` · js ${(win.work / win.workN).toFixed(2)}ms` : '');
}
