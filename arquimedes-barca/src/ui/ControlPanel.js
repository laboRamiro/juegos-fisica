// Única interacción del jugador: el slider de volumen de la barca.
// Vive en el DOM (fuera del canvas de Phaser) para tener un control
// nativo, accesible y fácil de estilar. Se comunica con el juego
// solo a través del EventBus.
(function () {
const { PHYSICS } = window.Arq;
const EventBus = window.Arq.EventBus;

// Volumen en cm³ (1 m³ = 1.000.000 cm³) — así lo pidió el diseño. Puertas
// adentro (BuoyancyPhysics) todo sigue en m³/SI; esto es solo conversión
// de despliegue.
const CC_PER_M3 = 1_000_000;

class ControlPanel {
  constructor() {
    this.slider = document.getElementById('volume-slider');
    this.valueLabel = document.getElementById('volume-value');

    this.slider.min = String(PHYSICS.VOLUME_MIN * CC_PER_M3);
    this.slider.max = String(PHYSICS.VOLUME_MAX * CC_PER_M3);
    this.slider.step = '1000';
    this._setSliderCC(PHYSICS.VOLUME_DEFAULT * CC_PER_M3);

    this.slider.addEventListener('input', () => {
      const cc = Number(this.slider.value);
      this._updateLabel(cc);
      EventBus.emit('volumeinput', { volume: cc / CC_PER_M3 });
    });

    EventBus.on('simulationreset', () => {
      this._setSliderCC(PHYSICS.VOLUME_DEFAULT * CC_PER_M3);
      this.slider.disabled = false;
    });

    EventBus.on('sinkingstarted', () => {
      this.slider.disabled = true;
    });
  }

  _setSliderCC(cc) {
    this.slider.value = String(cc);
    this._updateLabel(cc);
  }

  _updateLabel(cc) {
    this.valueLabel.textContent = `${Math.round(cc).toLocaleString('es-AR')} cm³`;
  }
}

window.Arq.ControlPanel = ControlPanel;
})();
