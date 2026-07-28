// Río: cuerpo de agua con oleaje suave y reflejos. Puramente visual —
// no tiene ninguna lógica física, solo reacciona a un "nivel de
// agitación" que la escena le puede pedir subir durante el hundimiento.
(function () {
const { COLORS, RENDER } = window.Arq;

class Water {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.agitation = 0; // 0 = calmo, 1 = agitado (durante hundimiento)

    this.body = scene.add.graphics().setDepth(5);
    this.highlights = scene.add.graphics().setDepth(6);
    this.ripples = scene.add.graphics().setDepth(8); // sobre el agua y las orillas, bajo el casco
  }

  setAgitation(value) {
    this.agitation = Phaser.Math.Clamp(value, 0, 1);
  }

  update(dt) {
    this.time += dt;
    this._drawBody();
    this._drawHighlights();
    this._drawRipples();
  }

  _drawBody() {
    const { WIDTH, HEIGHT, RIVER_TOP_Y } = RENDER;
    const g = this.body;
    g.clear();
    g.fillGradientStyle(
      COLORS.WATER, COLORS.WATER,
      COLORS.WATER_DEEP, COLORS.WATER_DEEP,
      1
    );
    g.fillRect(0, RIVER_TOP_Y, WIDTH, HEIGHT - RIVER_TOP_Y);

    // superficie del agua: se combinan varias ondas de distinta frecuencia
    // y fase para que no se vea como una única función seno prolija, sino
    // como agua irregular de verdad.
    const waveAmp = 2.5 + this.agitation * 5;
    g.lineStyle(2, COLORS.WATER_HIGHLIGHT, 0.4);
    g.beginPath();
    for (let x = 0; x <= WIDTH; x += 10) {
      const y = RIVER_TOP_Y
        + Math.sin(x * 0.021 + this.time * 0.9) * waveAmp * 0.55
        + Math.sin(x * 0.052 + this.time * 1.6 + 1.7) * waveAmp * 0.3
        + Math.sin(x * 0.009 + this.time * 0.45 + 4.1) * waveAmp * 0.4;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }

  _drawHighlights() {
    const g = this.highlights;
    g.clear();
    const baseY = RENDER.RIVER_TOP_Y + 30;
    for (let i = 0; i < 6; i += 1) {
      const x = 60 + i * 150 + Math.sin(this.time * 0.5 + i) * 20;
      const y = baseY + i * 40 + Math.cos(this.time * 0.6 + i) * 6;
      const alpha = 0.15 + 0.08 * Math.sin(this.time * 2 + i);
      g.fillStyle(COLORS.WATER_HIGHLIGHT, Math.max(0, alpha));
      g.fillEllipse(x, y, 70, 8);
    }
  }

  _drawRipples() {
    const g = this.ripples;
    g.clear();
    if (this.agitation < 0.05) return;
    const centerX = RENDER.BOAT_X;
    const centerY = RENDER.WATER_SURFACE_Y;
    const count = 3;
    for (let i = 0; i < count; i += 1) {
      const phase = (this.time * 1.5 + i / count) % 1;
      const radius = phase * 90 * (0.5 + this.agitation);
      const alpha = (1 - phase) * 0.5 * this.agitation;
      g.lineStyle(2, COLORS.WATER_HIGHLIGHT, alpha);
      g.strokeEllipse(centerX, centerY, radius * 2, radius * 0.6);
    }
  }
}

window.Arq.Water = Water;
})();
