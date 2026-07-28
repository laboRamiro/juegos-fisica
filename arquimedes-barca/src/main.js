// La UI (DOM) y el juego (Phaser) se arman por separado y se conectan
// solo a través del EventBus — ver src/utils/EventBus.js.
//
// Script clásico a propósito (no ES module): así todo el proyecto se
// puede abrir con doble clic sobre index.html, sin servidor local.
(function () {
const { RiverScene, ControlPanel, MetricsPanel, StatusIndicator, ResetButton, AudioManager, RENDER } = window.Arq;

new ControlPanel();
new MetricsPanel();
new StatusIndicator();
new ResetButton();
new AudioManager();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: RENDER.WIDTH,
  height: RENDER.HEIGHT,
  backgroundColor: '#dff4e0',
  scene: [RiverScene],
  render: { antialias: true },
});
})();
