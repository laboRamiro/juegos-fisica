// empaquetar.mjs — convierte un juego multi-archivo en un único HTML autocontenido
// (formato del catálogo, ver skill juego-fisica): incrusta cada <link rel="stylesheet" href>
// y cada <script src> locales. Las URLs http(s) se dejan como están (y se avisa).
//
// Uso: node tools/empaquetar.mjs <ruta/al/index.html> <salida.html>

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [entrada, salida] = process.argv.slice(2);
if (!entrada || !salida) {
  console.error('Uso: node tools/empaquetar.mjs <index.html> <salida.html>');
  process.exit(2);
}
const base = path.dirname(path.resolve(entrada));
let html = readFileSync(entrada, 'utf8');
let incrustados = 0;
const externos = [];

const leer = (ref) => readFileSync(path.resolve(base, ref), 'utf8');

html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (todo, href) => {
  if (/^https?:/.test(href)) { externos.push(href); return todo; }
  incrustados++;
  return `<style>/* ${href} */\n${leer(href)}\n</style>`;
});

html = html.replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (todo, src) => {
  if (/^https?:/.test(src)) { externos.push(src); return todo; }
  incrustados++;
  // "</script" dentro del código cerraría la etiqueta antes de tiempo.
  const codigo = leer(src).replace(/<\/script/gi, '<\\/script');
  return `<script>/* ${src} */\n${codigo}\n</script>`;
});

writeFileSync(salida, html);
console.log(`${path.basename(salida)}: ${incrustados} archivos incrustados, ${Math.round(html.length / 1024)} KB`);
if (externos.length) console.log(`  ⚠ quedaron referencias externas: ${externos.join(', ')}`);
