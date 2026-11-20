// generar-catalogo.mjs — genera index.html (la portada del repo) desde catalogo.json.
// La página es estática, sin scripts ni fetch: abre igual con doble clic (file://) y en GitHub Pages.
// Uso: node tools/generar-catalogo.mjs   (después de editar catalogo.json)

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const cat = JSON.parse(readFileSync(path.join(raiz, 'catalogo.json'), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const porTema = new Map();
for (const j of cat.juegos) {
  const k = String(j.tema);
  if (!porTema.has(k)) porTema.set(k, []);
  porTema.get(k).push(j);
}
const temasConJuego = new Set(porTema.keys());
const totalTemas = cat.unidades.flatMap((u) => u.temas).filter((t) => typeof t.n === 'number').length;
const cubiertos = cat.unidades.flatMap((u) => u.temas).filter((t) => typeof t.n === 'number' && temasConJuego.has(String(t.n))).length;

const tarjeta = (j) => `
        <a class="juego${j.estado === 'en-revision' ? ' revision' : ''}" href="${esc(j.archivo)}">
          <span class="titulo">${esc(j.titulo)}</span>
          ${j.estado === 'en-revision' ? '<span class="chip">En revisión</span>' : ''}${j.nota ? `<span class="nota">${esc(j.nota)}</span>` : ''}
        </a>`;

const unidades = cat.unidades.map((u) => {
  const filas = u.temas.map((t) => {
    const js = porTema.get(String(t.n)) || [];
    const num = typeof t.n === 'number' ? `<span class="num">${t.n}</span>` : '<span class="num">·</span>';
    return `
      <div class="tema${js.length ? '' : ' vacio'}">
        <h3>${num}${esc(t.nombre)}</h3>
        <div class="juegos">${js.length ? js.map(tarjeta).join('') : '\n        <span class="pendiente">Todavía sin juego</span>'}
        </div>
      </div>`;
  }).join('');
  return `
    <section class="unidad" id="unidad-${u.n}">
      <h2><span>Unidad ${u.n}</span>${esc(u.nombre)}</h2>${filas}
    </section>`;
}).join('');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Juegos de Física — Profe Ramiro</title>
<meta name="description" content="Catálogo de juegos de física para la secundaria, ordenados por unidad y tema.">
<style>
/* Paleta de ProfeRamiro: marketing/design-system/TEMPLATE_SPEC.md */
:root { --teal-oscuro:#0d4d47; --teal:#2f9c93; --teal-claro:#3aa89e; --coral:#e2604a; --azul:#4a90c4;
  --mostaza:#e0a83e; --texto:#3a3a3a; --suave:#6b7a78; --fondo:#f2f7f6; --tarjeta:#ffffff; --linea:#d5e4e1; }
* { box-sizing: border-box; }
body { margin:0; font-family:'Segoe UI', Arial, sans-serif; color:var(--texto); background:var(--fondo); line-height:1.45; }
header { background:linear-gradient(135deg, var(--teal-oscuro), var(--teal) 60%, var(--teal-claro)); color:#fff;
  padding:28px max(16px, env(safe-area-inset-left)) 24px; }
header .contenido, main { max-width:1080px; margin:0 auto; }
header h1 { margin:0 0 6px; font-size:clamp(26px, 5vw, 38px); letter-spacing:-.01em; }
header p { margin:0; opacity:.92; max-width:60ch; }
.resumen { display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:14px; font-size:14px; }
.resumen b { font-size:18px; }
nav { display:flex; flex-wrap:wrap; gap:6px; margin-top:16px; }
nav a { color:#fff; text-decoration:none; font-size:13px; padding:4px 10px; border:1px solid rgba(255,255,255,.45); border-radius:999px; }
nav a:hover { background:rgba(255,255,255,.15); }
main { padding:8px max(16px, env(safe-area-inset-left)) 48px; }
.unidad { margin-top:28px; }
.unidad h2 { font-size:20px; color:var(--teal-oscuro); margin:0 0 10px; display:flex; align-items:baseline; gap:10px; border-bottom:2px solid var(--teal); padding-bottom:6px; }
.unidad h2 span { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--coral); }
.tema { display:grid; grid-template-columns:minmax(0, 240px) minmax(0, 1fr); gap:12px; padding:10px 0; border-bottom:1px solid var(--linea); align-items:start; }
.tema h3 { margin:0; font-size:15px; font-weight:600; display:flex; gap:8px; align-items:baseline; }
.num { display:inline-block; min-width:26px; font-variant-numeric:tabular-nums; color:var(--teal); font-weight:700; }
.juegos { display:flex; flex-wrap:wrap; gap:8px; }
.juego { display:flex; flex-direction:column; gap:4px; text-decoration:none; color:var(--teal-oscuro); background:var(--tarjeta);
  border:1px solid var(--linea); border-radius:10px; padding:10px 14px; min-height:44px; justify-content:center; font-weight:600; }
.juego:hover, .juego:focus-visible { border-color:var(--teal); box-shadow:0 2px 10px rgba(13,77,71,.12); outline:none; }
.juego.revision { border-style:dashed; }
.chip { font-size:11px; font-weight:600; color:#8a5a00; background:#fbefd6; border-radius:999px; padding:1px 8px; align-self:flex-start; }
.nota { font-size:11px; font-weight:400; color:var(--suave); }
.vacio h3 { color:var(--suave); font-weight:400; }
.pendiente { font-size:13px; color:var(--suave); font-style:italic; padding:10px 0; }
footer { text-align:center; color:var(--suave); font-size:13px; padding:0 16px 32px; }
@media (max-width:640px) { .tema { grid-template-columns:minmax(0,1fr); gap:6px; } }
</style>
</head>
<body>
<header>
  <div class="contenido">
    <h1>Juegos de Física</h1>
    <p>Se descubre la ley jugando. Juegos cortos para la secundaria, ordenados por unidad y tema del programa.</p>
    <div class="resumen"><span><b>${cat.juegos.length}</b> juegos</span><span><b>${cubiertos}</b> de ${totalTemas} temas con juego</span></div>
    <nav>${cat.unidades.map((u) => `<a href="#unidad-${u.n}">${esc(u.nombre)}</a>`).join('')}</nav>
  </div>
</header>
<main>${unidades}
</main>
<footer>Profe Ramiro · Catálogo generado desde catalogo.json (${esc(cat.actualizado)})</footer>
</body>
</html>
`;
writeFileSync(path.join(raiz, 'index.html'), html);
console.log(`index.html: ${cat.juegos.length} juegos, ${cubiertos}/${totalTemas} temas cubiertos`);
const faltan = cat.juegos.filter((j) => { try { readFileSync(path.join(raiz, j.archivo)); return false; } catch { return true; } });
if (faltan.length) { console.error('⚠ Archivos inexistentes en catalogo.json:', faltan.map((j) => j.archivo).join(', ')); process.exit(1); }
