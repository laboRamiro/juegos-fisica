// Mono decorativo en los árboles. Puro ambiente: no interactúa con la
// barca ni con la física. Balanceo idle + parpadeo ocasional de cola.
(function () {
const { COLORS } = window.Arq;

class Monkey {
  constructor(scene, x, y) {
    this.x = x;
    this.y = y;
    this.phase = Math.random() * Math.PI * 2;
    this.graphics = scene.add.graphics().setDepth(11);
  }

  update(dt, time) {
    const g = this.graphics;
    g.clear();

    const sway = Math.sin(time * 1.1 + this.phase) * 3;
    const bx = this.x + sway;
    const by = this.y;

    // cuerpo
    g.fillStyle(COLORS.MONKEY_FUR, 1);
    g.fillEllipse(bx, by, 16, 20);
    // cabeza
    g.fillCircle(bx, by - 13, 8);
    // cara
    g.fillStyle(0xe8c9a0, 1);
    g.fillEllipse(bx, by - 12, 9, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(bx - 2.5, by - 13, 1.2);
    g.fillCircle(bx + 2.5, by - 13, 1.2);
    // orejas
    g.fillStyle(COLORS.MONKEY_FUR, 1);
    g.fillCircle(bx - 8, by - 15, 3.5);
    g.fillCircle(bx + 8, by - 15, 3.5);
    // cola colgando, con balanceo
    const tailSway = Math.sin(time * 1.6 + this.phase) * 10;
    g.lineStyle(3, COLORS.MONKEY_FUR, 1);
    g.beginPath();
    g.moveTo(bx, by + 9);
    g.lineTo(bx + tailSway, by + 26);
    g.strokePath();
  }
}

window.Arq.Monkey = Monkey;
})();
