class AudioManager {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playTurnStart() {
    this.init();
    this.playTone(440, 'sine', 0.1);
    setTimeout(() => this.playTone(880, 'sine', 0.2), 100);
  }

  playDrawConfirm() {
    this.init();
    this.playTone(600, 'square', 0.1, 0.05);
    setTimeout(() => this.playTone(800, 'square', 0.2, 0.05), 100);
  }

  playBidSuccess() {
    this.init();
    this.playTone(300, 'triangle', 0.1);
    setTimeout(() => this.playTone(400, 'triangle', 0.1), 100);
    setTimeout(() => this.playTone(500, 'triangle', 0.3), 200);
  }

  playCapture() {
    this.init();
    this.playTone(150, 'sawtooth', 0.5, 0.2); // deep bass sound
  }

  playEventTrigger() {
    this.init();
    this.playTone(100, 'square', 1.5, 0.3); // ominous low alarm
  }
}

export const audio = new AudioManager();