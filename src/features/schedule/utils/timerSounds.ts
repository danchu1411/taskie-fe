/**
 * Timer notification sounds using Web Audio API
 * No external audio files needed
 */

class TimerSounds {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  constructor() {
    // Initialize AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Play a pleasant notification sound for break time
   * Lower, softer tones for relaxation
   */
  playBreakSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create oscillator for pleasant chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Soft bell-like tone: E5 -> G5 -> B5
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.15); // G5
    osc.frequency.setValueAtTime(987.77, now + 0.3); // B5

    // Smooth fade in/out
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.7);

    osc.type = 'sine';
    osc.start(now);
    osc.stop(now + 0.7);
  }

  /**
   * Play an energetic notification sound for focus time
   * Higher, sharper tones for alertness
   */
  playFocusSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create two oscillators for richer sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    // Energetic rising tone: C5 -> E5 -> G5
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.24); // G5

    // Add harmonic for richness
    osc2.frequency.setValueAtTime(1046.5, now); // C6 (octave higher)
    osc2.frequency.setValueAtTime(1318.5, now + 0.12); // E6
    osc2.frequency.setValueAtTime(1567.98, now + 0.24); // G6

    // Quick fade in/out for sharpness
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc1.type = 'triangle';
    osc2.type = 'sine';
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  /**
   * Play completion sound (end of all sessions)
   * Triple chime for completion
   */
  playCompleteSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Three ascending chimes
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.2;
      const freq = 523.25 * Math.pow(1.5, i); // C5, G5, E6

      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.3);

      osc.type = 'sine';
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    }
  }
}

// Export singleton instance
export const timerSounds = new TimerSounds();

