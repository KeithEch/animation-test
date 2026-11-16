// Motion status pill: says in plain words whether this page's motion is actually running,
// so a tester can tell "too subtle to notice" apart from "switched off" or "broken".
//
// Tooling, like the meter: loaded by hud-loader.js (data-tooling), NOT counted in any JS budget,
// and not part of any demo. It only observes: it never starts, stops or changes an animation.
// Position is fixed, so it causes no layout shift. Tap it to shrink it to a dot.
//
// How "running" is detected, by what the page actually did (not by what it should do):
//   - CSS scroll-driven (and Motion when it hands off to the browser): a scroll-linked animation exists.
//   - Hand-written / GSAP parallax, or Motion's fallback: layers carry an inline transform.
//   - Fade-in B: the script armed the page (html.fade-armed).
//   - Page transitions can't be seen until you click, so it reports support instead.
const path = location.pathname;
const kind = path.startsWith('/parallax/') ? 'parallax'
  : path.startsWith('/fade/') ? 'fade'
  : path.startsWith('/transitions/') ? 'transition'
  : path.includes('baseline') ? 'baseline' : null;

if (kind) {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const usesScrollCSS = path === '/fade/css.html' || path === '/parallax/css.html';
  const cssSupport = CSS.supports('animation-timeline: view()');

  const scrollLinked = () => document.getAnimations().some(
    (a) => a.timeline && typeof DocumentTimeline !== 'undefined' && !(a.timeline instanceof DocumentTimeline));
  const scriptMoved = () => [...document.querySelectorAll('.px-layer')].some((l) => l.style.transform);

  const intensity = () => {
    const h = location.hash.slice(1) || 'whisper';
    const v = getComputedStyle(html).getPropertyValue(`--i-${h}`).trim();
    return v ? `${h[0].toUpperCase()}${h.slice(1)} ${v}` : 'Whisper';
  };
  const rise = () => {
    const r = document.querySelector('input[name="rise"]:checked');
    return r ? r.nextElementSibling.textContent : '';
  };

  // Returns [colour, text].
  const state = () => {
    if (kind === 'baseline') return ['grey', 'No motion on this page (control).'];
    if (kind === 'transition') {
      const scripted = !!document.querySelector('script[src*="t3.js"]');
      if (reduce.matches) return ['grey', `Reduce Motion is on: ${scripted ? 'no fade' : 'a short 150ms crossfade'} when you click a link.`];
      if (scripted) return ['green', 'Transition ready: click a link (works in every browser).'];
      return 'PageRevealEvent' in window
        ? ['green', 'Transition ready: click a link to see it.']
        : ['amber', 'This browser has no page transitions: links change page instantly.'];
    }
    if (reduce.matches) return ['grey', "Motion OFF: this device's Reduce Motion setting is on, so you see the still version."];
    const detail = kind === 'parallax' ? `Intensity: ${intensity()}` : `Rise: ${rise()}`;
    if (scrollLinked()) return ['green', `Motion running (browser-driven, scroll-linked). ${detail}`];
    if (scriptMoved() || html.classList.contains('fade-armed')) return ['green', `Motion running (page script). ${detail}`];
    if (usesScrollCSS && !cssSupport) return ['amber', "Not supported in this browser: you see the still version."];
    // Hidden tabs draw no frames, so frame-driven scripts haven't had a chance to run yet.
    if (document.hidden) return ['grey', 'Checking… (tab is in the background)'];
    return ['red', 'Motion NOT running, which is unexpected. Please report this page and browser to the developer.'];
  };

  const colours = { green: '#2e8b57', grey: '#8a8478', amber: '#c98a00', red: '#c0392b' };
  const el = document.createElement('div');
  el.id = 'motion-status';
  el.setAttribute('role', 'status');
  el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483646;max-width:calc(100vw - 16px);'
    + 'display:flex;gap:.5em;align-items:center;padding:.45em .8em;border-radius:999px;cursor:pointer;'
    + 'font:500 12px/1.3 system-ui,-apple-system,sans-serif;background:rgb(20 20 20 / .88);color:#fff;'
    + 'box-shadow:0 4px 14px rgb(0 0 0 / .2);-webkit-user-select:none;user-select:none';
  const dot = document.createElement('span');
  dot.style.cssText = 'flex:none;width:.75em;height:.75em;border-radius:50%';
  const text = document.createElement('span');
  el.append(dot, text);
  el.addEventListener('click', () => { text.hidden = !text.hidden; });

  const render = () => {
    const [c, t] = state();
    dot.style.background = colours[c];
    text.textContent = t;
    el.title = t;
    // Sit above the meter when it's open, so the two never overlap.
    const hud = document.getElementById('hud');
    el.style.bottom = hud ? `${hud.offsetHeight + 16}px` : '8px';
  };

  const start = () => {
    document.body.append(el);
    // Give scripts and IntersectionObserver a moment to do their first work before judging.
    setTimeout(render, 700);
    // Re-judge shortly after each scroll stops (hand-written parallax only writes once frames run).
    let t;
    addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(render, 150); }, { passive: true });
    document.addEventListener('visibilitychange', () => setTimeout(render, 300));
    addEventListener('hashchange', () => setTimeout(render, 100));
    document.addEventListener('change', render);
    reduce.addEventListener('change', () => setTimeout(render, 100));
    new MutationObserver(render).observe(document.body, { childList: true }); // the meter opening or closing
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
