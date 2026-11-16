// Loads the performance meter only when asked for, so it costs nothing otherwise.
// Turn on:  add ?hud to the URL, or use the switch on the index page (remembered).
// Turn off: ?hud=0, or the switch again.
// This is measurement tooling — it is NOT counted in any demo's JS budget.
const p = new URLSearchParams(location.search);
if (p.has('hud')) localStorage.setItem('hud', p.get('hud') === '0' ? '0' : '1');
if (localStorage.getItem('hud') === '1') import('./hud.js');
// Motion status pill (tooling, always on during testing): says whether this page's motion is running.
import('./status.js');
