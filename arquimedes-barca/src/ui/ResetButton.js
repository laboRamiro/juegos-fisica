// Dos entradas para el mismo comando: el botón chico siempre visible en
// el panel (el jugador puede reiniciar cuando quiera) y el overlay
// grande que aparece sobre el canvas unos segundos después de que la
// barca termina de hundirse (pedido explícito del diseño).
(function () {
const EventBus = window.Arq.EventBus;

class ResetButton {
  constructor() {
    this.panelButton = document.getElementById('reset-button');
    this.overlay = document.getElementById('sunk-overlay');
    this.overlayButton = document.getElementById('sunk-reset-button');

    const requestReset = () => EventBus.emit('requestreset');
    this.panelButton.addEventListener('click', requestReset);
    this.overlayButton.addEventListener('click', requestReset);

    EventBus.on('boatsunk', () => this.overlay.classList.add('visible'));
    EventBus.on('simulationreset', () => this.overlay.classList.remove('visible'));
  }
}

window.Arq.ResetButton = ResetButton;
})();
