// Trap-test self-check: test tooling, not part of any demo's JS budget.
//
// Every time this page is shown (fresh load, Back, Forward, restore from the back/forward
// cache) and after every scroll settles, it waits for fades to finish and then checks:
//   1. the page itself isn't faded out (no .is-leaving, body opacity 1);
//   2. every fade-in block that is on screen is fully visible.
// A badge in the corner shows PASS or FAIL, and how the page was shown.
(() => {
  const SETTLE = 1500; // longer than any fade on these pages
  const badge = document.createElement('div');
  badge.setAttribute('role', 'status');
  badge.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483646;font:600 12px/1.4 ui-monospace,Consolas,Menlo,monospace;' +
    'padding:6px 10px;border-radius:6px;color:#fff;background:#555;max-width:calc(100vw - 16px);pointer-events:none';
  document.body.append(badge);

  let how = 'fresh load';
  let timer;

  function check() {
    const problems = [];
    if (document.documentElement.classList.contains('is-leaving')) problems.push('page still marked as leaving');
    if (+getComputedStyle(document.body).opacity < 0.99) problems.push('page is faded out');
    const vh = innerHeight;
    let onScreen = 0, stranded = 0;
    for (const el of document.querySelectorAll('.reveal')) {
      const r = el.getBoundingClientRect();
      // Only blocks clearly on screen: fade-in B reveals at 15% visible, so a sliver at
      // the edge is legitimately still hidden. Count blocks at least 25% visible.
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible <= 0 || visible / r.height < 0.25) continue;
      onScreen++;
      if (+getComputedStyle(el).opacity < 0.99) stranded++;
    }
    if (stranded) problems.push(`${stranded} of ${onScreen} on-screen blocks invisible`);
    const ok = problems.length === 0;
    badge.style.background = ok ? '#2e7d32' : '#c62828';
    badge.textContent = ok
      ? `PASS · ${onScreen} on-screen blocks visible · shown by ${how}`
      : `FAIL · ${problems.join('; ')} · shown by ${how}`;
  }

  function schedule() {
    badge.style.background = '#555';
    badge.textContent = `Checking… (${how})`;
    clearTimeout(timer);
    timer = setTimeout(check, SETTLE);
  }

  addEventListener('pageshow', (e) => {
    const nav = performance.getEntriesByType('navigation')[0];
    how = e.persisted ? 'Back/Forward (restored from memory)'
      : nav?.type === 'back_forward' ? 'Back/Forward (reloaded)' : nav?.type === 'reload' ? 'reload' : 'fresh load';
    schedule();
  });
  addEventListener('scroll', schedule, { passive: true });
})();
