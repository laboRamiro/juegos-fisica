// Orquesta la escena: crea los sistemas (agua, barca, personajes,
// escenario) y los conecta entre sí. No tiene lógica física propia —
// eso vive en BuoyancyPhysics — ni lógica de UI — eso vive en el DOM,
// conectado vía EventBus.
(function () {
const { Water, Boat, Passenger, Dog, Jungle, EventBus } = window.Arq;
const { RENDER, STATUS } = window.Arq;

class RiverScene extends Phaser.Scene {
  constructor() {
    super('RiverScene');
  }

  create() {
    this.jungle = new Jungle(this);
    this.water = new Water(this);
    this.boat = new Boat(this);
    this.passenger = new Passenger(this);
    this.dog = new Dog(this);
    this.boat.attachCharacters(this.passenger, this.dog);

    this._wasSinking = false;
    this._sunkHandled = false;
    this._metricsAccum = 0;

    EventBus.on('volumeinput', ({ volume }) => this.boat.setTargetVolume(volume));
    EventBus.on('requestreset', () => this._handleReset());

    // snapshot inicial para que el panel no arranque vacío
    EventBus.emit('metricsupdate', this.boat.getPhysicsSnapshot());
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs, 50) / 1000; // clamp: evita saltos si la pestaña pierde foco

    this.jungle.update(dt);
    this.boat.update(dt);
    this.passenger.update(dt);
    this.dog.update(dt);

    const snapshot = this.boat.getPhysicsSnapshot();

    let targetAgitation = 0.08;
    if (this.boat.sinking) targetAgitation = 1;
    else if (snapshot.status === STATUS.WARNING) targetAgitation = 0.35;
    this.water.setAgitation(Phaser.Math.Linear(this.water.agitation, targetAgitation, 0.05));
    this.water.update(dt);

    if (this.boat.sinking && !this._wasSinking) {
      this._wasSinking = true;
      EventBus.emit('sinkingstarted');
    }
    if (this.boat.sunk && !this._sunkHandled) {
      this._sunkHandled = true;
      this.time.delayedCall(RENDER.RESET_DELAY_MS, () => EventBus.emit('boatsunk'));
    }

    this._metricsAccum += dt;
    if (this._metricsAccum >= 1 / 15) {
      this._metricsAccum = 0;
      const status = this.boat.sunk ? STATUS.SUNK : snapshot.status;
      EventBus.emit('metricsupdate', { ...snapshot, status });
    }
  }

  _handleReset() {
    this.boat.reset();
    this.water.setAgitation(0);
    this._wasSinking = false;
    this._sunkHandled = false;
    EventBus.emit('simulationreset');
  }
}

window.Arq.RiverScene = RiverScene;
})();
