// PARALLAX, APPROACH B: IntersectionObserver + one hand-written requestAnimationFrame step.
//
// Same maths as the CSS version: for each scene, progress p runs 0→1 from "top enters the
// bottom of the screen" to "bottom leaves the top", and each layer drifts by
// (p − 0.5) × intensity × its speed factor.
//
// Rules this follows:
//  - Geometry (scene positions) is measured only on load/resize, in one read-only pass.
//  - Per frame there is exactly ONE read (scrollY), then writes only. No read/write interleaving.
//  - A frame is only requested when the page actually scrolled AND at least one scene is on
//    screen. Nothing runs while idle, offscreen, or in a hidden tab.
//  - Reduced motion: never starts; turning it on mid-visit clears every transform.
//  - If this file never runs, the layers just sit in their resting composition.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  const scenes = [...document.querySelectorAll('.px-scene')].map((el) => ({
    el, top: 0, h: 0, on: false,
    layers: [...el.querySelectorAll('.px-layer')].map((l) => ({ l, f: parseFloat(l.style.getPropertyValue('--f')) || 0 })),
  }));

  let intensity = 0, vh = 0, queued = false, running = false;

  // Values live in parallax.css (--i-whisper etc.); the URL hash picks one.
  const readIntensity = () => {
    const cs = getComputedStyle(root);
    intensity = parseFloat(cs.getPropertyValue(`--i-${location.hash.slice(1)}`)) || parseFloat(cs.getPropertyValue('--i-whisper')) || 0;
  };

  // Read-only pass. Transforms on layers don't affect the scenes' own boxes, so this is stable.
  const measure = () => {
    vh = innerHeight;
    const y = scrollY;
    for (const s of scenes) { const r = s.el.getBoundingClientRect(); s.top = r.top + y; s.h = r.height; }
  };

  const frame = () => {
    queued = false;
    const t0 = performance.now();
    const y = scrollY; // the one read this frame
    for (const s of scenes) {
      if (!s.on) continue;
      const p = Math.min(1, Math.max(0, (y + vh - s.top) / (vh + s.h)));
      const d = (p - 0.5) * intensity;
      for (const { l, f } of s.layers) l.style.transform = `translate3d(0,${(d * f).toFixed(2)}px,0)`;
    }
    globalThis.__hudWork?.(performance.now() - t0); // meter hook; no-op without the meter
  };

  const request = () => {
    if (queued || !running || document.hidden) return;
    if (!scenes.some((s) => s.on)) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const s = scenes.find((x) => x.el === e.target);
      s.on = e.isIntersecting;
    }
    request();
  }, { rootMargin: '10% 0px' }); // start a little before a scene is visible

  const onResize = () => { measure(); request(); };
  const ro = new ResizeObserver(onResize); // catches late-loading fonts/images changing heights

  function start() {
    if (running) return;
    running = true;
    readIntensity();
    measure();
    for (const s of scenes) io.observe(s.el);
    ro.observe(document.body);
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', onResize);
    request();
  }

  function stop() {
    running = false;
    io.disconnect(); ro.disconnect();
    removeEventListener('scroll', request);
    removeEventListener('resize', onResize);
    for (const s of scenes) { s.on = false; for (const { l } of s.layers) l.style.transform = ''; }
  }

  addEventListener('hashchange', () => { readIntensity(); request(); }); // intensity picker
  document.addEventListener('visibilitychange', request);
  reduce.addEventListener('change', () => (reduce.matches ? stop() : start()));
  if (!reduce.matches) start();
})();
