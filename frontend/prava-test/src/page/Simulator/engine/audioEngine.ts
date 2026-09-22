/**
 * PRAVAONLINE — Web Audio API Real-time Driving Simulator Audio Engine
 * Pure browser-synthesized audio: Zero external MP3/WAV assets, zero latency, zero 404 risks.
 */

class SimulatorAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.7;

  // Master Gain Node
  private masterGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Horn nodes
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  private initContext(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  // -------------------------------------------------------------
  // Engine Synthesis (Dual Oscillator modulated by RPM & Throttle)
  // -------------------------------------------------------------
  public startEngine(): void {
    if (this.isEngineRunning || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = "triangle";
      this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn("[AudioEngine] Error starting engine audio", e);
    }
  }

  public updateEngine(rpm: number, throttle: number): void {
    if (!this.isEngineRunning || !this.ctx) return;

    // RPM 800 -> ~42 Hz, RPM 6000 -> ~160 Hz
    const clampedRpm = Math.max(700, Math.min(6500, rpm));
    const targetFreq = 38 + (clampedRpm / 6000) * 125;
    const now = this.ctx.currentTime;

    if (this.engineOsc) {
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }
    if (this.engineSubOsc) {
      this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);
    }
    if (this.engineFilter) {
      const filterFreq = 260 + throttle * 480 + (clampedRpm / 6000) * 320;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    }
    if (this.engineGain) {
      const gainVal = 0.15 + throttle * 0.18 + (clampedRpm / 6000) * 0.08;
      this.engineGain.gain.setTargetAtTime(gainVal, now, 0.08);
    }
  }

  public stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.engineSubOsc) {
        this.engineSubOsc.stop();
        this.engineSubOsc.disconnect();
      }
    } catch {}
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  // -------------------------------------------------------------
  // Braking Tire Screech (Filtered White Noise)
  // -------------------------------------------------------------
  public triggerBrakeScreech(intensity: number = 0.5): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const duration = 0.25;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1200 + intensity * 600, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(3.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(Math.min(0.28, intensity * 0.35), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      noise.stop(now + duration);
    } catch {}
  }

  // -------------------------------------------------------------
  // Collision Thump (Low Sine Drop)
  // -------------------------------------------------------------
  public playCollisionSound(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.22);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // -------------------------------------------------------------
  // Turn Signal Indicator Clicker (Tick-Tock)
  // -------------------------------------------------------------
  public playBlinkerClick(isHigh: boolean = false): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(isHigh ? 920 : 760, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // -------------------------------------------------------------
  // Horn (Dual-Tone 440 Hz + 554 Hz)
  // -------------------------------------------------------------
  public startHorn(): void {
    if (this.hornOsc1 || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc1.type = "sawtooth";
      this.hornOsc1.frequency.setValueAtTime(440, now);

      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc2.type = "sawtooth";
      this.hornOsc2.frequency.setValueAtTime(554, now);

      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.22, now);

      this.hornOsc1.connect(this.hornGain);
      this.hornOsc2.connect(this.hornGain);
      this.hornGain.connect(this.masterGain);

      this.hornOsc1.start(now);
      this.hornOsc2.start(now);
    } catch {}
  }

  public stopHorn(): void {
    if (!this.hornOsc1) return;
    try {
      this.hornOsc1.stop();
      this.hornOsc2?.stop();
      this.hornOsc1.disconnect();
      this.hornOsc2?.disconnect();
    } catch {}
    this.hornOsc1 = null;
    this.hornOsc2 = null;
    this.hornGain = null;
  }

  // -------------------------------------------------------------
  // Reverse Beep (800 Hz pulse)
  // -------------------------------------------------------------
  public playReverseBeep(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(820, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // -------------------------------------------------------------
  // Penalty Buzzer (Descending Dissonant Alert)
  // -------------------------------------------------------------
  public playPenaltyBuzzer(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // -------------------------------------------------------------
  // Success Fanfare (Major Triad Arpeggio: C5 - E5 - G5 - C6)
  // -------------------------------------------------------------
  public playSuccessFanfare(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = now + idx * 0.12;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.24, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.32);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch {}
  }
}

export const audioEngine = new SimulatorAudioEngine();
