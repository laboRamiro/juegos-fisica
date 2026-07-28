// Entidad visual de la barca. Traduce el volumen (m³) en geometría de
// pantalla y delega en BuoyancyPhysics el cálculo de cuánto debe quedar
// sumergido. No decide "juego" — solo dibuja lo que la física dice.
(function () {
const { COLORS, RENDER, PHYSICS, STATUS } = window.Arq;
const { computeEquilibrium } = window.Arq.Physics;

class Boat {
  constructor(scene) {
    this.scene = scene;

    this.targetVolume = PHYSICS.VOLUME_DEFAULT;
    this.displayedVolume = PHYSICS.VOLUME_DEFAULT; // se interpola hacia targetVolume
    this.volumeTween = null;

    this.time = 0;
    this.sinking = false;
    this.sinkProgress = 0; // 0..1
    this.sunk = false;

    this.hullGraphics = scene.add.graphics().setDepth(20);
    this.submergedOverlay = scene.add.graphics().setDepth(21);
    this.waterlineMarker = scene.add.graphics().setDepth(22);

    // Máscara fija: todo lo que esté por debajo de la línea de agua.
    const maskShape = scene.add.graphics().setVisible(false);
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, RENDER.WATER_SURFACE_Y, RENDER.WIDTH, RENDER.HEIGHT - RENDER.WATER_SURFACE_Y);
    this.submergedOverlay.setMask(maskShape.createGeometryMask());

    this.passenger = null; // asignado por RiverScene
    this.dog = null;

    this._applyVolumeInstant(PHYSICS.VOLUME_DEFAULT);
  }

  attachCharacters(passenger, dog) {
    this.passenger = passenger;
    this.dog = dog;
  }

  /** Llamado por ControlPanel (vía RiverScene) cuando el jugador mueve el slider. */
  setTargetVolume(volume) {
    this.targetVolume = Phaser.Math.Clamp(volume, PHYSICS.VOLUME_MIN, PHYSICS.VOLUME_MAX);
    if (this.sinking || this.sunk) return; // no se puede corregir una vez que se está hundiendo

    if (this.volumeTween) this.volumeTween.stop();
    this.volumeTween = this.scene.tweens.add({
      targets: this,
      displayedVolume: this.targetVolume,
      duration: RENDER.VOLUME_TWEEN_MS,
      ease: 'Sine.easeOut',
    });
  }

  reset() {
    if (this.volumeTween) this.volumeTween.stop();
    this.sinking = false;
    this.sunk = false;
    this.sinkProgress = 0;
    this.targetVolume = PHYSICS.VOLUME_DEFAULT;
    this._applyVolumeInstant(PHYSICS.VOLUME_DEFAULT);
  }

  _applyVolumeInstant(volume) {
    this.displayedVolume = volume;
    this.targetVolume = volume;
  }

  /** @returns {object} snapshot físico actual, para UI y para RiverScene. */
  getPhysicsSnapshot() {
    return computeEquilibrium(this.displayedVolume);
  }

  update(dt) {
    this.time += dt;
    const snapshot = computeEquilibrium(this.displayedVolume);

    if (snapshot.status === STATUS.SINKING && !this.sinking && !this.sunk) {
      this._beginSinking();
    }

    const scale = Math.cbrt(this.displayedVolume / PHYSICS.VOLUME_REFERENCE);
    const hullWidth = RENDER.BOAT_REF_WIDTH * scale;
    const hullHeight = RENDER.BOAT_REF_HEIGHT * scale;

    const bobAmplitude = 2 + (snapshot.status === STATUS.WARNING ? 1 : 0);
    const bob = Math.sin(this.time * 1.2) * bobAmplitude;
    const sway = Math.sin(this.time * 0.8) * 2;

    let hullTopY;
    if (this.sinking) {
      this.sinkProgress = Math.min(1, this.sinkProgress + dt / (RENDER.SINK_DURATION_MS / 1000));
      const sinkEase = this.sinkProgress * this.sinkProgress; // aceleración simple (Euler-like ease-in)
      const fullySubmergedY = RENDER.WATER_SURFACE_Y - hullHeight * 0.15;
      const restingDepthY = RENDER.WATER_SURFACE_Y + hullHeight * 1.8;
      hullTopY = Phaser.Math.Linear(fullySubmergedY, restingDepthY, sinkEase);
      if (this.sinkProgress >= 1) this.sunk = true;
    } else {
      const immersion = snapshot.immersionRatio;
      hullTopY = RENDER.WATER_SURFACE_Y - (1 - immersion) * hullHeight + bob;
    }

    const boatX = RENDER.BOAT_X + sway * (this.sinking ? 2.5 : 1);

    this._drawHull(boatX, hullTopY, hullWidth, hullHeight);
    this._drawWaterlineMarker(boatX, hullWidth);

    if (this.passenger) this.passenger.setDeck(boatX, hullTopY, this.sinking);
    if (this.dog) this.dog.setDeck(boatX, hullTopY, this.sinking);

    this._lastSnapshot = snapshot;
  }

  _beginSinking() {
    this.sinking = true;
    this.sinkProgress = 0;
    if (this.volumeTween) this.volumeTween.stop();
  }

  _hullPoints(width, height) {
    // Trapecio tipo canoa: ancho arriba (cubierta), angosto abajo (quilla).
    const halfTop = width / 2;
    const halfBottom = width * 0.32;
    return [
      { x: -halfTop, y: 0 },
      { x: halfTop, y: 0 },
      { x: halfBottom, y: height },
      { x: -halfBottom, y: height },
    ];
  }

  _drawHull(x, topY, width, height) {
    const points = this._hullPoints(width, height).map((p) => ({ x: x + p.x, y: topY + p.y }));

    this.hullGraphics.clear();
    this.hullGraphics.fillStyle(COLORS.HULL_WOOD, 1);
    this.hullGraphics.fillPoints(points, true);
    this.hullGraphics.lineStyle(3, COLORS.HULL_WOOD_DARK, 1);
    this.hullGraphics.strokePoints(points, true);

    this.submergedOverlay.clear();
    this.submergedOverlay.fillStyle(COLORS.WATER_DEEP, 0.55);
    this.submergedOverlay.fillPoints(points, true);
  }

  _drawWaterlineMarker(x, width) {
    const g = this.waterlineMarker;
    g.clear();
    if (this.sunk || this.sinking) return; // no tiene sentido marcar la línea de flotación mientras se hunde
    const y = RENDER.WATER_SURFACE_Y;
    const halfW = width / 2 + 6;
    g.lineStyle(2, COLORS.WATER_HIGHLIGHT, 0.9);
    g.beginPath();
    g.moveTo(x - halfW, y);
    g.lineTo(x + halfW, y);
    g.strokePath();
  }
}

window.Arq.Boat = Boat;
})();
