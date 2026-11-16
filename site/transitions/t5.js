// T5 · COLOUR BARS: cover the page with four bars on link click, then navigate.
// The arrival half (bars sweeping off the new page) is pure CSS, switched on by the small
// inline script in each page's <head>. See t5.css for the whole picture.
//
// Traps handled:
//  - Back button: the back/forward cache restores this page exactly as left, i.e. covered.
//    'pageshow' fires on every show, including those restores, and removes the cover.
//  - Navigation that never happens (blocked, failed): a 4-second safety net uncovers the page.
//  - Arrival cover: removed after the bars have left. The CSS already parks them offscreen,
//    so this is tidiness, not a dependency.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const COVER_MS = 720; // 600ms + 3 × 40ms stagger, as in t5.css

  if (root.classList.contains('t5-enter')) setTimeout(() => root.classList.remove('t5-enter'), 1500);
  addEventListener('pageshow', () => root.classList.remove('t5-leave'));

  document.addEventListener('click', (e) => {
    if (reduce.matches) return; // reduced motion: plain, instant navigation
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page / in-page anchor

    e.preventDefault();
    if (root.classList.contains('t5-leave')) return; // already on its way
    // Start fetching the next page now, while the bars cover, so it's ready when they are.
    const pre = document.createElement('link');
    pre.rel = 'prefetch'; pre.href = url.href;
    document.head.append(pre);

    root.classList.remove('t5-enter');
    root.classList.add('t5-leave');
    setTimeout(() => {
      try { sessionStorage.setItem('t5-covered', String(Date.now())); } catch {}
      location.href = url.href;
    }, COVER_MS);
    setTimeout(() => root.classList.remove('t5-leave'), 4000);
  });
})();
