/**
 * Audio synthesis engine for ARGUS panopticon cinematic sounds using Web Audio API.
 * Provides authentic tactile clicks, biometric sweeps, sub-bass rumbles, and iris aperture snaps.
 */

class ArgusAudioController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Audio autoplay policy handled silently
    }
  }

  public playAwakeningSwell() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Deep sub-bass cinematic pulse
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45, t);
      subOsc.frequency.exponentialRampToValueAtTime(90, t + 1.2);
      subGain.gain.setValueAtTime(0.01, t);
      subGain.gain.linearRampToValueAtTime(0.35, t + 0.6);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 1.5);

      // 2. High-tech harmonic shimmer
      const harmOsc = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harmOsc.type = 'sawtooth';
      harmOsc.frequency.setValueAtTime(220, t + 0.1);
      harmOsc.frequency.exponentialRampToValueAtTime(880, t + 1.0);
      harmGain.gain.setValueAtTime(0.01, t + 0.1);
      harmGain.gain.linearRampToValueAtTime(0.08, t + 0.5);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      // Low pass filter to make it analog and rich
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(2400, t + 0.8);

      harmOsc.connect(filter);
      filter.connect(harmGain);
      harmGain.connect(this.ctx.destination);
      harmOsc.start(t + 0.1);
      harmOsc.stop(t + 1.2);

      // 3. Crisp mechanical camera shutter / aperture click at t + 0.7
      setTimeout(() => {
        this.playApertureSnap();
      }, 650);
    } catch {
      // Audio handled silently
    }
  }

  public playApertureSnap() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Noise burst for mechanical camera lens shutter
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch {
      // Audio handled silently
    }
  }

  public playEyeBlink() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(740, t + 0.04);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {
      // Ignored
    }
  }
}

export const argusAudio = new ArgusAudioController();
