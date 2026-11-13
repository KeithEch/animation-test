// FADE-IN, APPROACH B: IntersectionObserver + a CSS transition.
//
// Resting state: every .reveal is visible. This script is the ONLY thing that can hide
// anything, and it only hides blocks that are below the fold at the moment it runs.
// If it never runs (blocked, failed, old browser), the page reads normally.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;

  const els = [...document.querySelectorAll('.reveal')];

  // One read pass: which blocks are already on screen? Those are never hidden,
  // so nothing above the fold "pops" on load.
  const vh = innerHeight;
  const below = els.map((el) => el.getBoundingClientRect().top >= vh);

  // Then one write pass. Mark on-screen blocks as revealed BEFORE arming,
  // so they never pass through the hidden state.
  els.forEach((el, i) => { if (!below[i]) el.classList.add('is-in'); });
  document.documentElement.classList.add('fade-armed');

  let heard = false;
  const io = new IntersectionObserver((entries) => {
    const t0 = performance.now();
    heard = true;
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
    globalThis.__hudWork?.(performance.now() - t0); // meter hook; no-op without the meter
  }, { threshold: 0.15 }); // 15% of the block visible. Reachable even for the last block on the page.

  els.forEach((el, i) => { if (below[i]) io.observe(el); });

  const revealAll = () => { io.disconnect(); for (const el of els) el.classList.add('is-in'); };

  // Safety net 1: an observer always reports once for every element right after observe().
  // If nothing has arrived within a second of the page being visible, show everything.
  const watchdog = () => {
    if (heard || !below.includes(true)) return;
    if (document.hidden) {
      document.addEventListener('visibilitychange', () => setTimeout(watchdog, 1000), { once: true });
    } else revealAll();
  };
  setTimeout(watchdog, 1000);

  // Safety net 2: reduced motion switched on mid-visit, so show everything now.
  reduce.addEventListener('change', revealAll);

  // Printing is covered in CSS (@media print), which beats any hidden state.
})();
