# Vendored libraries

Used only by the parallax comparison demos (`parallax/motion.html`, `parallax/gsap.html`).
Copied in as plain files so there's no build step, and so `npm run size` measures exactly what ships.

| File | Source | License | gzip |
|---|---|---|---|
| `motion-14.14.0-animate-scroll.min.js` | `motion@14.14.0`, bundled with esbuild from `export { animate, scroll } from 'motion'` (`--bundle --minify --format=esm`) | MIT | 28.6 KB |
| `gsap-3.15.1.min.js` | `gsap@3.15.1` `dist/gsap.min.js`, unmodified | GSAP Standard "no charge" license, https://gsap.com/standard-license | 27.9 KB |
| `ScrollTrigger-3.15.1.min.js` | `gsap@3.15.1` `dist/ScrollTrigger.min.js`, unmodified | same as above | 17.6 KB |

The Motion bundle is tree-shaken to the two functions the demo uses, which is how a production build
would ship it. Motion's full UMD build (`dist/motion.js`) is 191 KB raw and would be an unfair comparison.
To rebuild it:

```powershell
mkdir mbuild; cd mbuild
npm init -y
npm install motion@14.14.0 esbuild
"export { animate, scroll } from 'motion';" | Out-File -Encoding ascii entry.js
npx esbuild entry.js --bundle --minify --format=esm --outfile=motion-14.14.0-animate-scroll.min.js
```
