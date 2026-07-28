// Persona sentada en la barca. No se mueve ni interactúa — solo respira,
// parpadea, y reacciona con sorpresa cuando la barca empieza a hundirse.
// Tamaño fijo (no escala con el volumen de la barca): su masa no cambia,
// así que visualmente "ella" es la referencia constante del sistema.
(function () {
const { COLORS } = window.Arq;

class Passenger {
  constructor(scene, offsetX = -34) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.graphics = scene.add.graphics().setDepth(23);

    this.time = 0;
    this.blinkTimer = Phaser.Math.Between(2000, 4000);
    this.blinking = false;
    this.surprised = false;
  }

  setDeck(boatX, deckY, sinking) {
    this.x = boatX + this.offsetX;
    this.deckY = deckY;
    this.surprised = sinking;
  }

  update(dt) {
    this.time += dt;
    this.blinkTimer -= dt * 1000;
    if (this.blinkTimer <= 0) {
      this.blinking = true;
      if (this.blinkTimer < -150) {
        this.blinking = false;
        this.blinkTimer = Phaser.Math.Between(2500, 5000);
      }
    }
    this._draw();
  }

  _draw() {
    if (this.x === undefined) return;
    const g = this.graphics;
    g.clear();

    const breathe = Math.sin(this.time * 2.2) * 1.5;
    const bodyH = 34 + breathe;
    const headY = this.deckY - bodyH - 12;
    const shoulderY = this.deckY - bodyH + 6;

    // cuerpo (remera)
    g.fillStyle(COLORS.SHIRT, 1);
    g.fillRoundedRect(this.x - 11, this.deckY - bodyH, 22, bodyH, 6);

    // brazos
    if (this.surprised) {
      // ambos brazos arriba, sorpresa por el hundimiento
      g.lineStyle(4, COLORS.SKIN, 1);
      g.beginPath();
      g.moveTo(this.x - 10, shoulderY);
      g.lineTo(this.x - 18, headY - 6);
      g.moveTo(this.x + 10, shoulderY);
      g.lineTo(this.x + 18, headY - 6);
      g.strokePath();
    } else {
      // brazo izquierdo relajado
      g.lineStyle(4, COLORS.SKIN, 1);
      g.lineBetween(this.x - 9, shoulderY, this.x - 12, this.deckY - 4);

      // brazo derecho saludando, con un leve agite
      const waveAngle = -1.2 + Math.sin(this.time * 3.2) * 0.35;
      const armLen = 15;
      const handX = this.x + 9 + Math.cos(waveAngle) * armLen;
      const handY = shoulderY + Math.sin(waveAngle) * armLen;
      g.lineBetween(this.x + 9, shoulderY, handX, handY);
      g.fillStyle(COLORS.SKIN, 1);
      g.fillCircle(handX, handY, 3);
    }

    // cabeza
    g.fillStyle(COLORS.SKIN, 1);
    g.fillCircle(this.x, headY, 11);

    // sombrero: ala + copa
    g.fillStyle(COLORS.HAT, 1);
    g.fillEllipse(this.x, headY - 6, 27, 7);
    g.fillEllipse(this.x, headY - 12, 17, 12);
    g.fillStyle(COLORS.HAT_BAND, 1);
    g.fillRect(this.x - 8, headY - 8, 16, 3);

    // ojos
    if (this.surprised) {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(this.x - 4, headY - 1, 3.2);
      g.fillCircle(this.x + 4, headY - 1, 3.2);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(this.x - 4, headY - 1, 1.6);
      g.fillCircle(this.x + 4, headY - 1, 1.6);
      // boca sorprendida
      g.fillStyle(0x6b2c2c, 1);
      g.fillCircle(this.x, headY + 6, 2.6);
    } else if (!this.blinking) {
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(this.x - 4, headY - 1, 1.6);
      g.fillCircle(this.x + 4, headY - 1, 1.6);
    } else {
      g.lineStyle(1.6, 0x1a1a1a, 1);
      g.lineBetween(this.x - 5.5, headY - 1, this.x - 2.5, headY - 1);
      g.lineBetween(this.x + 2.5, headY - 1, this.x + 5.5, headY - 1);
    }
  }
}

window.Arq.Passenger = Passenger;
})();
