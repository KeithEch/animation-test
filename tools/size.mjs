// JS weight per page, gzipped — the numbers for the README's budget columns.
//   node tools/size.mjs
//
// Follows each page's local <script src> tags and the static/dynamic imports inside them.
// Scripts marked data-tooling (the performance meter) are excluded from the totals.
// Files under site/vendor/ count as "library"; everything else counts as "own code".
// Budgets: library 45KB target / 60KB fail; total page JS 100KB target / 150KB fail.
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, resolve, dirname, relative, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'site');
const KB = (n) => (n / 1024).toFixed(1);

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const toFile = (from, spec) => spec.startsWith('/') ? join(root, spec) : resolve(dirname(from), spec);

async function collect(file, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  const src = await readFile(file, 'utf8');
  for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s*['"](\.{0,2}\/[^'"]+)['"]|import\s*\(\s*['"](\.{0,2}\/[^'"]+)['"]\s*\)|import\s*['"](\.{0,2}\/[^'"]+)['"]/g)) {
    await collect(toFile(file, m[1] || m[2] || m[3]), seen);
  }
}

const rows = [];
for (const page of (await htmlFiles(root)).sort()) {
  const html = await readFile(page, 'utf8');
  const seen = new Set();
  let inlineBytes = 0;
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const [, attrs, body] = m;
    if (/data-tooling/.test(attrs) || /type=["']?(application\/ld\+json|importmap)/.test(attrs)) continue;
    const s = attrs.match(/src=["']([^"']+)["']/);
    if (s && !/^https?:/.test(s[1])) await collect(toFile(page, s[1]), seen);
    else if (!s) inlineBytes += gzipSync(body).length;
  }
  let lib = 0, own = inlineBytes;
  for (const f of seen) {
    const gz = gzipSync(await readFile(f)).length;
    if (f.includes(`${sep}vendor${sep}`)) lib += gz; else own += gz;
  }
  const total = lib + own;
  const flag = total > 150 * 1024 || lib > 60 * 1024 ? 'FAIL'
    : total > 100 * 1024 || lib > 45 * 1024 ? 'over target' : 'ok';
  rows.push(`| ${relative(root, page).split(sep).join('/')} | ${KB(lib)} | ${KB(own)} | ${KB(total)} | ${flag} |`);
}

console.log('| Page | Library KB gz | Own JS KB gz | Total KB gz | Budget |');
console.log('|---|---:|---:|---:|---|');
console.log(rows.join('\n'));
