(function () {
const EventBus = window.Arq.EventBus;
const { STATUS } = window.Arq;

const PRESET = {
  [STATUS.FLOATING]: { emoji: '🟢', text: 'Flotando correctamente', cls: 'status-ok' },
  [STATUS.WARNING]: { emoji: '🟡', text: 'Cerca del límite', cls: 'status-warning' },
  [STATUS.SINKING]: { emoji: '🔴', text: 'Se hunde', cls: 'status-danger' },
  [STATUS.SUNK]: { emoji: '🔴', text: 'Hundida', cls: 'status-danger' },
};

class StatusIndicator {
  constructor() {
    this.badge = document.getElementById('status-badge');
    EventBus.on('metricsupdate', (snapshot) => this._render(snapshot.status));
  }

  _render(status) {
    const preset = PRESET[status] || PRESET[STATUS.FLOATING];
    this.badge.textContent = `${preset.emoji} ${preset.text}`;
    this.badge.className = `status-badge ${preset.cls}`;
  }
}

window.Arq.StatusIndicator = StatusIndicator;
})();
