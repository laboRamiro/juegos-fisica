// Escenario de selva: cielo, árboles con viento, lianas, aves de paso y
// monos decorativos. Todo cosmético — no participa de la física ni del
// gameplay, solo transmite la ambientación relajada que pidió el diseño.
(function () {
const { COLORS, RENDER } = window.Arq;
const Monkey = window.Arq.Monkey;

class Jungle {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;

    this.skyGraphics = scene.add.graphics().setDepth(0);
    this.bankGraphics = scene.add.graphics().setDepth(7);
    this.bushGraphics = scene.add.graphics().setDepth(9.5);
    this.treeGraphics = scene.add.graphics().setDepth(10);
    this.lianaGraphics = scene.add.graphics().setDepth(9);
    this.birdGraphics = scene.add.graphics().setDepth(30);

    this._drawSky();
    this._drawBanks(); // estática: no depende del tiempo, se dibuja una sola vez

    this.trees = [
      { x: 70, scale: 1.1 }, { x: 190, scale: 0.85 },
      { x: 850, scale: 1.15 }, { x: 930, scale: 0.9 },
    ];

    this.bushes = [
      { x: 25, y: 362, scale: 1 }, { x: 130, y: 384, scale: 0.85 }, { x: 215, y: 364, scale: 0.9 },
      { x: 755, y: 374, scale: 0.9 }, { x: 865, y: 392, scale: 1 }, { x: 938, y: 362, scale: 0.8 },
    ];

    // cada liana cuelga de un árbol puntual (treeIndex en this.trees),
    // no de un punto fijo del cielo
    this.lianas = [
      { treeIndex: 1, dx: 24, len: 85 },
      { treeIndex: 2, dx: -20, len: 65 },
      { treeIndex: 3, dx: 16, len: 100 },
    ];

    this.monkeys = [
      new Monkey(scene, 95, 150),
      new Monkey(scene, 905, 165),
    ];

    // pre-poblamos un par de pájaros ya en vuelo para que la escena no
    // arranque vacía: se piden "de fondo", no como evento raro y puntual.
    this.birds = [];
    this.maxBirds = 3;
    this._spawnBird(true);
    this._spawnBird(true);
    this.nextBirdIn = Phaser.Math.Between(1500, 3000);
  }

  _drawSky() {
    const g = this.skyGraphics;
    g.fillGradientStyle(COLORS.SKY_TOP, COLORS.SKY_TOP, COLORS.SKY_BOTTOM, COLORS.SKY_BOTTOM, 1);
    g.fillRect(0, 0, RENDER.WIDTH, RENDER.RIVER_TOP_Y + 20);
  }

  // Orillas a los costados: sin esto, el agua (ancho completo) llegaba
  // hasta el borde de la pantalla y los árboles parecían plantados
  // directamente en el río. El borde interior es irregular (suma de
  // senos de distinta frecuencia) para que no se vea como una costa
  // geométrica perfecta. Entre el pasto y el agua va una franja marrón
  // (barro/arena húmeda) para que la transición no sea un corte brusco
  // de verde a azul.
  _drawBanks() {
    const { HEIGHT, RIVER_TOP_Y } = RENDER;
    const g = this.bankGraphics;
    const topY = RIVER_TOP_Y; // mismo nivel que el horizonte del agua
    const grassWidth = 235;
    const mudWidth = 24;

    const edgeOffset = (y, phase) =>
      18 * Math.sin(y * 0.045 + phase)
      + 9 * Math.sin(y * 0.11 + phase * 1.7 + 1.3)
      + 5 * Math.sin(y * 0.21 + phase * 0.6 + 2.7);

    const edgePoints = (fromEdgeX, sign, phase, width) => {
      const points = [];
      for (let y = topY; y <= HEIGHT; y += 18) {
        points.push({ x: fromEdgeX + sign * (width + edgeOffset(y, phase)), y });
      }
      return points;
    };

    [{ fromEdgeX: 0, sign: 1, phase: 0 }, { fromEdgeX: RENDER.WIDTH, sign: -1, phase: 2.4 }]
      .forEach(({ fromEdgeX, sign, phase }) => {
        // pasto: desde el borde de pantalla hasta el límite exterior
        const grassOuter = edgePoints(fromEdgeX, sign, phase, grassWidth);
        g.fillStyle(COLORS.SHORE, 1);
        g.fillPoints([{ x: fromEdgeX, y: topY }, ...grassOuter, { x: fromEdgeX, y: HEIGHT }], true);

        // franja marrón de transición, pegada al agua
        const mudOuter = grassOuter;
        const mudInner = edgePoints(fromEdgeX, sign, phase, grassWidth - mudWidth);
        g.fillStyle(COLORS.MUD, 1);
        g.fillPoints([...mudOuter, ...[...mudInner].reverse()], true);

        // borde húmedo, justo contra el agua
        g.lineStyle(3, COLORS.MUD_WET, 0.85);
        g.beginPath();
        mudInner.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
        g.strokePath();
      });
  }

  update(dt) {
    this.time += dt;
    this._drawTrees();
    this._drawBushes();
    this._drawLianas();
    this._updateBirds(dt);
    this.monkeys.forEach((m) => m.update(dt, this.time));
  }

  _drawTrees() {
    const g = this.treeGraphics;
    g.clear();
    const wind = Math.sin(this.time * 0.9) * 4;

    this.trees.forEach((tree, i) => {
      const sway = wind * (0.6 + 0.4 * Math.sin(i * 1.7)) * tree.scale;
      const x = tree.x;
      const trunkH = 190 * tree.scale;
      const topY = RENDER.RIVER_TOP_Y - trunkH + 40;

      g.fillStyle(COLORS.TRUNK, 1);
      g.fillRect(x - 9 * tree.scale, topY, 18 * tree.scale, trunkH);

      // raíces: unas cuñas que flarean desde la base del tronco al piso
      const baseY = topY + trunkH;
      g.fillStyle(COLORS.ROOT, 1);
      [-1, -0.45, 0.45, 1].forEach((dir) => {
        const spread = 15 * tree.scale;
        g.fillTriangle(
          x + dir * 3 * tree.scale, baseY - 5 * tree.scale,
          x + dir * spread + sway * 0.3, baseY + 13 * tree.scale,
          x + dir * 8 * tree.scale, baseY - 2 * tree.scale
        );
      });

      const clusters = [
        { dx: 0, dy: -10, r: 46 },
        { dx: -34, dy: 10, r: 34 },
        { dx: 34, dy: 6, r: 36 },
        { dx: 0, dy: 30, r: 40 },
      ];
      const colors = [COLORS.FOLIAGE_DARK, COLORS.FOLIAGE_MID, COLORS.FOLIAGE_MID, COLORS.FOLIAGE_LIGHT];
      clusters.forEach((c, ci) => {
        g.fillStyle(colors[ci], 1);
        g.fillCircle(x + (c.dx + sway) * tree.scale, topY + c.dy * tree.scale, c.r * tree.scale);
      });
    });
  }

  _drawBushes() {
    const g = this.bushGraphics;
    g.clear();
    const wind = Math.sin(this.time * 0.9) * 2;

    this.bushes.forEach((bush, i) => {
      const sway = wind * (0.5 + 0.5 * Math.sin(i * 2.1));
      const bx = bush.x + sway;
      const by = bush.y;
      const s = bush.scale;

      g.fillStyle(COLORS.FOLIAGE_DARK, 1);
      g.fillEllipse(bx - 12 * s, by + 4 * s, 26 * s, 18 * s);
      g.fillStyle(COLORS.FOLIAGE_MID, 1);
      g.fillEllipse(bx + 10 * s, by + 3 * s, 28 * s, 20 * s);
      g.fillStyle(COLORS.FOLIAGE_LIGHT, 1);
      g.fillEllipse(bx, by - 6 * s, 24 * s, 17 * s);
    });
  }

  _drawLianas() {
    const g = this.lianaGraphics;
    g.clear();
    g.lineStyle(3, COLORS.FOLIAGE_DARK, 0.85);
    this.lianas.forEach((liana, i) => {
      const tree = this.trees[liana.treeIndex];
      const trunkH = 190 * tree.scale;
      const canopyTopY = RENDER.RIVER_TOP_Y - trunkH + 40; // igual cálculo que _drawTrees
      const originX = tree.x + liana.dx * tree.scale;
      const originY = canopyTopY + 18 * tree.scale; // cuelga desde dentro del follaje, no de la punta

      const sway = Math.sin(this.time * 0.7 + i * 2) * 10;
      g.beginPath();
      g.moveTo(originX, originY);
      g.lineTo(originX + sway * 0.5, originY + liana.len * 0.5);
      g.lineTo(originX + sway, originY + liana.len);
      g.strokePath();
      // hojita en la punta
      g.fillStyle(COLORS.FOLIAGE_MID, 1);
      g.fillEllipse(originX + sway, originY + liana.len, 10, 6);
    });
  }

  // "De fondo" = presencia casi continua, no un evento raro que pasa una
  // vez cada tanto. Mantenemos hasta maxBirds en pantalla y reponemos
  // rápido al que sale, en vez de esperar varios segundos entre vuelos.
  _spawnBird(startAlreadyInScene = false) {
    const fromLeft = Math.random() > 0.5;
    this.birds.push({
      x: startAlreadyInScene
        ? Phaser.Math.Between(40, RENDER.WIDTH - 40)
        : (fromLeft ? -20 : RENDER.WIDTH + 20),
      y: Phaser.Math.Between(30, 130),
      vx: (fromLeft ? 1 : -1) * Phaser.Math.Between(22, 42),
      phase: Math.random() * Math.PI * 2,
    });
  }

  _updateBirds(dt) {
    this.nextBirdIn -= dt * 1000;
    if (this.nextBirdIn <= 0 && this.birds.length < this.maxBirds) {
      this.nextBirdIn = Phaser.Math.Between(1500, 3000);
      this._spawnBird();
    }

    this.birds.forEach((b) => {
      b.x += b.vx * dt;
      b.phase += dt * 8;
    });
    this.birds = this.birds.filter((b) => b.x > -40 && b.x < RENDER.WIDTH + 40);

    const g = this.birdGraphics;
    g.clear();
    g.lineStyle(2, 0x3a3a3a, 0.8);
    this.birds.forEach((b) => {
      const flap = Math.sin(b.phase) * 5;
      g.beginPath();
      g.moveTo(b.x - 8, b.y - flap);
      g.lineTo(b.x, b.y);
      g.lineTo(b.x + 8, b.y - flap);
      g.strokePath();
    });
  }
}

window.Arq.Jungle = Jungle;
})();
