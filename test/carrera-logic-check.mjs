// Extrae el primer <script> de carrera-mru-mrua.html (modelo fisico puro, sin DOM) y lo
// evalua en Node contra valores de referencia calculados a mano.
// Uso: node test/carrera-logic-check.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = readFileSync(path.join(__dirname, '..', 'carrera-mru-mrua.html'), 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const physicsSrc = scripts.find((s) => s.includes('module.exports'));
if (!physicsSrc) throw new Error('No se encontro el script del modelo fisico puro (falta module.exports)');

const sandbox = { module: { exports: {} }, console };
vm.createContext(sandbox);
vm.runInContext(physicsSrc, sandbox, { filename: 'carrera-mru-mrua.html#script1' });
const { positionA, positionB, velocityB, finishTimeA, finishTimeB, crossing, predictRace } = sandbox.module.exports;

let failures = 0;
function check(label, actual, expected, tol = 0.001) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) failures++;
}
function assertTrue(label, cond) {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}`);
  if (!cond) failures++;
}

// Caso 1: vA=4, aB=1, D=100 -> B (acelerado) gana, cruce dentro de la pista.
{
  const vA = 4, aB = 1, D = 100;
  check('positionA(4, 3s)', positionA(vA, 3), 12);
  check('positionB(1, 3s)', positionB(aB, 3), 4.5);
  check('velocityB(1, 3s)', velocityB(aB, 3), 3);
  check('finishTimeA', finishTimeA(vA, D), 25);
  check('finishTimeB', finishTimeB(aB, D), Math.sqrt(200));
  const cr = crossing(vA, aB);
  check('crossing t = 2v/a', cr.t, 8);
  check('crossing x = v*t', cr.x, 32);
  // en el cruce, ambos moviles deben estar exactamente en la misma posicion
  check('positionA(t_cross) == positionB(t_cross)', positionA(vA, cr.t), positionB(aB, cr.t));
  const p = predictRace(vA, aB, D);
  assertTrue('cruce dentro de la pista (x_cross <= D)', p.crossingOnTrack === true);
  assertTrue('B gana (tB < tA)', p.winner === 'B');
}

// Caso 2: vA=10, aB=0.5, D=50 -> A (constante) gana, el cruce teorico cae fuera de la pista.
{
  const vA = 10, aB = 0.5, D = 50;
  check('finishTimeA', finishTimeA(vA, D), 5);
  check('finishTimeB', finishTimeB(aB, D), Math.sqrt(200));
  const p = predictRace(vA, aB, D);
  assertTrue('cruce fuera de la pista (x_cross > D)', p.crossingOnTrack === false);
  assertTrue('A gana (tA < tB)', p.winner === 'A');
}

// Monotonia: ambas posiciones nunca decrecen con t, y B siempre parte mas lento que A hasta el cruce.
{
  const vA = 6, aB = 2;
  let prevA = -1, prevB = -1, monotonic = true;
  for (let t = 0; t <= 10; t += 0.1) {
    const xA = positionA(vA, t), xB = positionB(aB, t);
    if (xA < prevA - 1e-9 || xB < prevB - 1e-9) monotonic = false;
    prevA = xA; prevB = xB;
  }
  assertTrue('posiciones monotonas crecientes en el tiempo', monotonic);

  const cr = crossing(vA, aB); // t=6, x=36
  check('crossing t', cr.t, 6);
  assertTrue('antes del cruce, A va adelante de B', positionA(vA, cr.t - 0.5) > positionB(aB, cr.t - 0.5));
  assertTrue('despues del cruce, B va adelante de A', positionB(aB, cr.t + 0.5) > positionA(vA, cr.t + 0.5));
}

// Los 3 desafios curados del juego (extraidos del segundo <script>, LEVELS): margen chico
// entre autos y ganador no siempre el mismo, para que "adivinar" tenga sentido.
{
  const gameSrc = scripts.find((s) => s.includes('const LEVELS'));
  if (!gameSrc) throw new Error('No se encontro el script del juego (falta LEVELS)');
  const levelsMatch = gameSrc.match(/const LEVELS = (\[[\s\S]*?\]);/);
  if (!levelsMatch) throw new Error('No se pudo extraer LEVELS del script del juego');
  const levelsSandbox = { module: { exports: {} } };
  vm.createContext(levelsSandbox);
  vm.runInContext(`module.exports = ${levelsMatch[1]};`, levelsSandbox);
  const LEVELS = levelsSandbox.module.exports;

  assertTrue('hay exactamente 3 niveles', LEVELS.length === 3);

  const EXPECTED = [
    { winner: 'A', maxGapPct: 12 },
    { winner: 'B', maxGapPct: 12 },
    { winner: 'A', maxGapPct: 12 },
  ];
  const winners = new Set();
  LEVELS.forEach((lvl, i) => {
    const p = predictRace(lvl.vA, lvl.aB, lvl.D);
    const gapPct = Math.abs(p.tA - p.tB) / Math.max(p.tA, p.tB) * 100;
    assertTrue(`Nivel ${i + 1} gana ${EXPECTED[i].winner}`, p.winner === EXPECTED[i].winner);
    assertTrue(`Nivel ${i + 1} margen ajustado (<${EXPECTED[i].maxGapPct}%): ${gapPct.toFixed(1)}%`, gapPct < EXPECTED[i].maxGapPct);
    winners.add(p.winner);
  });
  assertTrue('no gana siempre el mismo auto en los 3 niveles', winners.size > 1);
}

console.log(failures === 0 ? '\nTODO OK' : `\n${failures} FALLO(S)`);
process.exit(failures === 0 ? 0 : 1);
