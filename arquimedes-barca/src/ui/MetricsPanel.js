// Muestra en vivo las magnitudes que calcula BuoyancyPhysics. No calcula
// nada por su cuenta — solo formatea el snapshot que le manda RiverScene.
(function () {
const EventBus = window.Arq.EventBus;
const CC_PER_M3 = 1_000_000; // volumen se muestra en cm³, física interna en m³

class MetricsPanel {
  constructor() {
    this.els = {
      mass: document.getElementById('metric-mass'),
      weight: document.getElementById('metric-weight'),
      boatVolume: document.getElementById('metric-boat-volume'),
      displacedVolume: document.getElementById('metric-displaced-volume'),
      buoyantForce: document.getElementById('metric-buoyant-force'),
      immersion: document.getElementById('metric-immersion'),
      density: document.getElementById('metric-density'),
      margin: document.getElementById('metric-margin'),
    };

    EventBus.on('metricsupdate', (snapshot) => this._render(snapshot));
  }

  _render(s) {
    this.els.mass.textContent = `${s.totalMass.toFixed(0)} kg`;
    this.els.weight.textContent = `${s.totalWeight.toFixed(0)} N`;
    this.els.boatVolume.textContent = `${Math.round(s.boatVolume * CC_PER_M3).toLocaleString('es-AR')} cm³`;
    this.els.displacedVolume.textContent = `${Math.round(s.displacedVolume * CC_PER_M3).toLocaleString('es-AR')} cm³`;
    this.els.buoyantForce.textContent = `${s.buoyantForce.toFixed(0)} N`;
    this.els.immersion.textContent = `${(s.immersionRatio * 100).toFixed(1)}%`;

    const cmp = s.averageDensity < s.waterDensity ? '<' : '≥';
    this.els.density.textContent =
      `${s.averageDensity.toFixed(0)} ${cmp} ${s.waterDensity.toFixed(0)} kg/m³`;

    const marginCC = s.marginVolume * CC_PER_M3;
    this.els.margin.textContent = marginCC > 0
      ? `${Math.round(marginCC).toLocaleString('es-AR')} cm³`
      : `agotado (déficit ${Math.round(Math.abs(marginCC)).toLocaleString('es-AR')} cm³)`;
  }
}

window.Arq.MetricsPanel = MetricsPanel;
})();
