// PARALLAX, APPROACH C: Motion (motion.dev), animate() + scroll().
//
// Each layer gets a linear transform animation, and scroll() binds it to its scene's
// progress through the viewport (offset 'start end' → 'end start' = the same "cover" range
// as the CSS version). Where the browser supports native scroll timelines, Motion hands the
// animation to them (no per-frame JS). Elsewhere it falls back to its own scroll listener.
//
// Animating the whole `transform` string (not Motion's x/y shorthands) keeps it eligible
// for native, hardware-accelerated playback.
//
// Reduced motion: never starts. If the setting changes, or the intensity picker is used,
// the page reloads, the simplest correct way to rebuild every animation from scratch.
import { animate, scroll } from '/vendor/motion-14.14.0-animate-scroll.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
reduce.addEventListener('change', () => location.reload());
addEventListener('hashchange', () => location.reload());

if (!reduce.matches) {
  // Values live in parallax.css (--i-whisper etc.); the URL hash picks one.
  const cs = getComputedStyle(document.documentElement);
  const intensity = parseFloat(cs.getPropertyValue(`--i-${location.hash.slice(1)}`)) || parseFloat(cs.getPropertyValue('--i-whisper')) || 0;
  for (const scene of document.querySelectorAll('.px-scene')) {
    for (const layer of scene.querySelectorAll('.px-layer')) {
      const a = (intensity * (parseFloat(layer.style.getPropertyValue('--f')) || 0)) / 2;
      const anim = animate(
        layer,
        { transform: [`translate3d(0,${-a}px,0)`, `translate3d(0,${a}px,0)`] },
        { ease: 'linear' },
      );
      scroll(anim, { target: scene, offset: ['start end', 'end start'] });
    }
  }
}
