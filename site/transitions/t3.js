// T3 · SCRIPTED FADE: fade the page out on link click, then navigate.
//
// The trap this handles: the Back button. Browsers keep recently left pages frozen in memory
// (the "back/forward cache") and restore them exactly as they were, which here means faded
// out to opacity 0. 'pageshow' fires on every show, including those restores, and clears it.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const LEAVE_MS = 200;

  addEventListener('pageshow', () => root.classList.remove('is-leaving'));

  document.addEventListener('click', (e) => {
    if (reduce.matches) return; // reduced motion: plain, instant navigation
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page / in-page anchor

    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, LEAVE_MS);
    // Safety net: if navigation is blocked or fails, never leave a blank page behind.
    setTimeout(() => root.classList.remove('is-leaving'), 4000);
  });
})();
