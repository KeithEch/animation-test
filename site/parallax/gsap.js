// PARALLAX, APPROACH D: GSAP + ScrollTrigger.
//
// One tween per layer, from −a to +a on `y` (GSAP writes this as a transform), scrubbed
// directly to scroll position across the same "cover" range as the other versions:
// start 'top bottom' (scene top meets screen bottom) → end 'bottom top'.
// scrub: true = locked to scroll with no smoothing, the fair comparison. (scrub: 0.5 adds a
// soft "catch-up" lag, which some people like. Try it if comparing feel.)
//
// GSAP computes every frame in JavaScript on the main thread. It does not use the
// browser's native scroll timelines.
//
// Reduced motion: gsap.matchMedia() only builds the tweens while
// (prefers-reduced-motion: no-preference) matches, and automatically reverts every layer
// to its resting state if that stops matching.
gsap.registerPlugin(ScrollTrigger);

addEventListener('hashchange', () => location.reload()); // intensity picker: rebuild cleanly

gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  // Values live in parallax.css (--i-whisper etc.); the URL hash picks one.
  const cs = getComputedStyle(document.documentElement);
  const intensity = parseFloat(cs.getPropertyValue(`--i-${location.hash.slice(1)}`)) || parseFloat(cs.getPropertyValue('--i-whisper')) || 0;
  for (const scene of document.querySelectorAll('.px-scene')) {
    for (const layer of scene.querySelectorAll('.px-layer')) {
      const a = (intensity * (parseFloat(layer.style.getPropertyValue('--f')) || 0)) / 2;
      gsap.fromTo(layer, { y: -a }, {
        y: a,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  }
});
