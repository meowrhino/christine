/* ============================================================
   build.mjs — data/site.json + projects/ + index.html → dist/, la web tal
   cual se publica.        node build/build.mjs

   La web es una sola página (el lienzo lo pinta app.js). El build revisa los
   JSON, que cada proyecto tenga su imagen y los mismos ejes que los demás,
   escribe lo que se lee sin JS (los proyectos) y la imagen al compartir
   (1200×630, sharp).

   Si algo está mal (una coma, un campo mal escrito, una imagen que no está)
   para y dice qué, y no se publica nada: la web se queda como estaba.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugsOf } from '../js/house.js';
import { leerJSON, validar } from '../js/validar.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const at = (...p) => join(ROOT, ...p);
const fail = (msg) => { console.error(`\n✗ ${msg}\n\nNo se ha publicado nada: la web sigue como estaba.\n`); process.exit(1); };

/* ---------- leer y revisar ---------- */

const read = (rel) => {
  if (!existsSync(at(rel))) fail(`no encuentro ${rel}`);
  try { return leerJSON(readFileSync(at(rel), 'utf8'), rel); } catch (e) { fail(e.message); }
};
const schema = (t) => JSON.parse(readFileSync(at('schema', `${t}.json`), 'utf8'));
const site = read('data/site.json');
const errors = validar(site, schema('site'), 'data/site.json');
const projects = {};
for (const slug of errors.length ? [] : slugsOf(site)) {
  const rel = `projects/${slug}/project.json`;
  if (projects[slug]) { errors.push(`data/site.json: "${slug}" está dos veces en "lists"`); continue; }
  if (!existsSync(at(rel))) { errors.push(`data/site.json: "lists" dice "${slug}", y no hay ningún ${rel}`); continue; }
  projects[slug] = read(rel);
  errors.push(...validar(projects[slug], schema('project'), rel));
  if (!existsSync(at('projects', slug, '1.webp'))) errors.push(`${rel}: falta projects/${slug}/1.webp`);
}
// los ejes salen del primero: todos tienen que llevar los mismos
const slugs = Object.keys(projects);
const axes = slugs.length ? Object.keys(projects[slugs[0]].axes || {}).sort().join(', ') : '';
for (const s of errors.length ? [] : slugs) {
  if (Object.keys(projects[s].axes).sort().join(', ') !== axes) errors.push(`projects/${s}/project.json: "axes" tiene que llevar los mismos ejes que los demás: ${axes}`);
}
if (errors.length) fail(errors.join('\n✗ '));
for (const d of readdirSync(at('projects'))) {
  if (existsSync(at('projects', d, 'project.json')) && !projects[d]) console.warn(`⚠ projects/${d} no está en data/site.json → lists: no se publica`);
}

/* Dónde se publica: este repo ES la web (no hay copia de Christine), en
   GitHub Pages: meowrhino.github.io/<repo>/, sin indexar mientras no tenga
   dominio ("url" en site.json). */
const github = process.env.GITHUB_ACTIONS === 'true';
const repo = (process.env.GITHUB_REPOSITORY || '/').split('/')[1];
const SITE = site.url ? site.url.replace(/\/+$/, '') : github ? `https://meowrhino.github.io/${repo}` : '';
const INDEX = !!site.url;

/* ---------- la imagen al compartir, con sharp: el primer proyecto ---------- */

let og = null;
try {
  const sharp = (await import('sharp')).default;
  const src = at('projects', slugs[0], '1.webp');
  const cached = at('.cache', 'og', 'home.jpg');
  if (!(existsSync(cached) && statSync(cached).mtimeMs >= statSync(src).mtimeMs)) {
    mkdirSync(dirname(cached), { recursive: true });
    await sharp(src).resize(1104, 534, { fit: 'contain', background: '#ffffff' })
      .extend({ top: 48, bottom: 48, left: 48, right: 48, background: '#ffffff' })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 85, mozjpeg: true }).toFile(cached);
  }
  og = cached;
} catch (e) {
  console.warn(`⚠ sin la imagen para compartir (${e.code || e.message}). Se arregla con: npm ci`);
}

/* ---------- la página ---------- */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function swap(html, find, replace) {
  if (!find.test(html)) fail(`no encuentro ${find} en index.html: el build lo necesita para escribir la página.`);
  return html.replace(find, replace);
}
const desc = `${site.title}: graphic design. ${slugs.map((s) => projects[s].title.split(' – ')[0]).join(', ')}.`;
let html = readFileSync(at('index.html'), 'utf8');
html = swap(html, /<html lang="([^"]*)">/, '<html lang="$1" data-built>');
html = swap(html, /(<title>[^<]*<\/title>)/, `$1
  <meta name="description" content="${esc(desc.length > 160 ? desc.slice(0, 157) + '…' : desc)}">
  <meta name="robots" content="${INDEX ? 'index,follow' : 'noindex'}">
  <link rel="canonical" href="${SITE}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(site.title)}">
  <meta property="og:url" content="${SITE}/">${og ? `\n  <meta property="og:image" content="${SITE}/og/home.jpg">` : ''}
  <meta name="twitter:card" content="summary_large_image">`);
html = swap(html, /(<body[^>]*>)/, `$1
  <noscript>
    <h1>${esc(site.title)}</h1>
${slugs.map((s) => `    <h2>${esc(projects[s].title)}</h2>\n${projects[s].text.map((p) => `    <p>${esc(p)}</p>`).join('\n')}`).join('\n')}
  </noscript>`);

/* ---------- escribir dist/ ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['style.css', 'app.js', 'js', 'img', 'data', 'projects', 'cooper-hewitt.heavy.otf']) cpSync(at(f), join(OUT, f), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
writeFileSync(join(OUT, 'index.html'), html);
if (og) { mkdirSync(join(OUT, 'og'), { recursive: true }); cpSync(og, join(OUT, 'og', 'home.jpg')); }
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`✓ dist/: el lienzo con ${slugs.length} proyectos${INDEX ? ` · se indexa (${SITE})` : ' · sin indexar'}`);
