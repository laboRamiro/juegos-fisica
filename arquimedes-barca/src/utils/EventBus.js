// Puente mínimo entre el panel de UI (DOM, fuera de Phaser) y la escena
// (RiverScene). Evita acoplar los módulos de UI directamente al motor
// de juego: la UI emite intención ("el usuario movió el slider") y la
// escena emite hechos ("estas son las métricas actuales").
(function () {

class EventBus extends EventTarget {
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  on(name, handler) {
    this.addEventListener(name, (e) => handler(e.detail));
  }
}

window.Arq.EventBus = new EventBus();
})();
