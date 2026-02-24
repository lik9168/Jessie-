export class AudioManager {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  constructor() {}

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  startMusic() {
    this.init();
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;

    const marioTheme = [
      { f: 659.25, d: 0.15 }, { f: 0, d: 0.05 },
      { f: 659.25, d: 0.15 }, { f: 0, d: 0.15 },
      { f: 659.25, d: 0.15 }, { f: 0, d: 0.15 },
      { f: 523.25, d: 0.15 }, { f: 659.25, d: 0.15 }, { f: 0, d: 0.15 },
      { f: 783.99, d: 0.3 }, { f: 0, d: 0.3 },
      { f: 392.00, d: 0.3 }, { f: 0, d: 0.3 },
    ];

    let noteIndex = 0;
    const playNextNote = () => {
      if (!this.isPlaying || !this.ctx) return;

      const note = marioTheme[noteIndex];
      if (note.f > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.d);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + note.d);
      }

      noteIndex = (noteIndex + 1) % marioTheme.length;
      setTimeout(playNextNote, note.d * 1000 + 50);
    };

    playNextNote();
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
  }

  playExplosion() {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}
