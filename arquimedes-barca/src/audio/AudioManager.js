// Todo el audio es sintetizado con Web Audio API — no hay archivos que
// descargar ni empaquetar, y el juego sigue corriendo con un solo
// index.html. Sin música ni ruido de fondo continuo: solo eventos
// puntuales (olas contra las rocas, pájaros, SFX de juego), tal como
// pidió el diseño ("no invasiva").
(function () {
const EventBus = window.Arq.EventBus;

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.started = false;
    this.lastTickAt = 0;

    const start = () => this._start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });

    EventBus.on('volumeinput', () => this._playTick());
    EventBus.on('sinkingstarted', () => this._playSinking());
    EventBus.on('simulationreset', () => this._playSplash(0.5));
  }

  _start() {
    if (this.started) return;
    this.started = true;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this._scheduleWaveCrash();
    this._scheduleBirdChirp();
  }

  // --- Ambiente: olas que golpean contra las rocas, de vez en cuando —
  // no un hiss continuo. Cada evento es un estallido de ruido con una
  // envolvente rápida al pegar y una caída lenta (la resaca).
  _scheduleWaveCrash() {
    const delay = 3500 + Math.random() * 5500;
    setTimeout(() => {
      if (this.ctx) this._playWaveCrash(0.55 + Math.random() * 0.45);
      this._scheduleWaveCrash();
    }, delay);
  }

  _playWaveCrash(intensity = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dur = 1.1;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const t = i / bufferSize;
      const envelope = t < 0.12 ? t / 0.12 : (1 - (t - 0.12) / 0.88) ** 1.6;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + dur);

    const gain = ctx.createGain();
    gain.gain.value = 0.18 * intensity;

    source.connect(filter).connect(gain).connect(this.masterGain);
    source.start();
  }

  _scheduleBirdChirp() {
    const delay = 3000 + Math.random() * 6000;
    setTimeout(() => {
      if (this.ctx) this._playChirp();
      this._scheduleBirdChirp();
    }, delay);
  }

  _playChirp() {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = 1800 + Math.random() * 800;
    osc.frequency.setValueAtTime(base, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(base * 1.4, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // --- SFX ---
  _playTick() {
    if (!this.ctx) return;
    const now = performance.now();
    if (now - this.lastTickAt < 90) return; // evita spam mientras se arrastra el slider
    this.lastTickAt = now;

    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 420;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);

    this._playSplash(0.15);
  }

  _playSplash(intensity = 0.3) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dur = 0.25;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0.12 * intensity;
    source.connect(filter).connect(gain).connect(this.masterGain);
    source.start();
  }

  _playSinking() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 2.2);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);

    this._playSplash(1);
    this._playWaveCrash(1);
  }
}

window.Arq.AudioManager = AudioManager;
})();
