// Perro sentado junto a la persona. Misma lógica que Passenger:
// tamaño fijo, respiración, parpadeo, reacción de sorpresa.
(function () {
const { COLORS } = window.Arq;

class Dog {
  constructor(scene, offsetX = 24) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.graphics = scene.add.graphics().setDepth(23);

    this.time = 0;
    this.earTwitchTimer = Phaser.Math.Between(1500, 3500);
  }

  setDeck(boatX, deckY, sinking) {
    this.x = boatX + this.offsetX;
    this.deckY = deckY;
    this.surprised = sinking;
  }

  update(dt) {
    this.time += dt;
    this.earTwitchTimer -= dt * 1000;
    if (this.earTwitchTimer <= 0) this.earTwitchTimer = Phaser.Math.Between(1500, 3500);
    this._draw();
  }

  _draw() {
    if (this.x === undefined) return;
    const g = this.graphics;
    g.clear();

    const breathe = Math.sin(this.time * 2.6) * 1.2;
    const bodyW = 26;
    const bodyH = 16 + breathe;
    const bodyY = this.deckY - bodyH;

    // cuerpo
    g.fillStyle(COLORS.DOG_FUR, 1);
    g.fillEllipse(this.x, bodyY + bodyH / 2, bodyW, bodyH);

    // cabeza
    const headX = this.x + 14;
    const headY = bodyY - 2 + (this.surprised ? -3 : 0);
    g.fillCircle(headX, headY, 9);

    // orejas
    const earTwitch = this.earTwitchTimer < 200 ? -3 : 0;
    g.fillStyle(COLORS.DOG_FUR, 1);
    g.fillTriangle(
      headX - 6, headY - 6,
      headX - 11, headY - 14 + earTwitch,
      headX - 2, headY - 9
    );
    g.fillTriangle(
      headX + 5, headY - 7,
      headX + 10, headY - 15,
      headX + 1, headY - 10
    );

    // hocico
    g.fillStyle(0xf0dcb8, 1);
    g.fillEllipse(headX + 7, headY + 3, 8, 6);
    g.fillStyle(0x2a1a10, 1);
    g.fillCircle(headX + 10, headY + 3, 1.6);

    // ojo
    g.fillStyle(0x1a1a1a, 1);
    if (this.surprised) {
      g.fillCircle(headX - 1, headY - 1, 2.4);
      // cola/orejas alerta ya cubre la sorpresa; boca abierta:
      g.fillStyle(0x6b2c2c, 1);
      g.fillEllipse(headX + 7, headY + 6, 4, 3);
    } else {
      g.fillCircle(headX - 1, headY - 1, 1.5);
    }

    // cola
    const tailWag = Math.sin(this.time * 5) * 6;
    g.lineStyle(4, COLORS.DOG_FUR, 1);
    g.beginPath();
    g.moveTo(this.x - bodyW / 2, bodyY + bodyH / 2);
    g.lineTo(this.x - bodyW / 2 - 8, bodyY + bodyH / 2 - 8 + tailWag);
    g.strokePath();
  }
}

window.Arq.Dog = Dog;
})();
