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
   * Warm, relaxing tones with gentle reverb effect (plays twice)
   */
  playBreakSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Play twice with a pause in between
    for (let repeat = 0; repeat < 2; repeat++) {
      const repeatDelay = repeat * 2.2; // 2.2s between repeats

      // Create low-pass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now + repeatDelay);
      filter.Q.setValueAtTime(1, now + repeatDelay);

      // Main gain
      const masterGain = ctx.createGain();
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Play soft descending tones like wind chimes: A4 -> F4 -> D4
      const frequencies = [440, 349.23, 293.66]; // A4, F4, D4
      const delays = [0, 0.25, 0.5];

      frequencies.forEach((freq, i) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(filter);

        const startTime = now + repeatDelay + delays[i];

        // Main tone
        osc1.frequency.setValueAtTime(freq, startTime);
        osc1.type = 'sine';

        // Subtle harmonic for richness (perfect fifth above)
        osc2.frequency.setValueAtTime(freq * 1.5, startTime);
        osc2.type = 'sine';

        // Gentle fade in and long fade out
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 1.2);
        osc2.stop(startTime + 1.2);
      });

      // Master fade out
      masterGain.gain.setValueAtTime(1, now + repeatDelay);
      masterGain.gain.setValueAtTime(1, now + repeatDelay + 1.0);
      masterGain.gain.linearRampToValueAtTime(0, now + repeatDelay + 1.8);
    }
  }

  /**
   * Play an energetic notification sound for focus time
   * Bright, clear tones for alertness - gentle but motivating (plays twice)
   */
  playFocusSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Play twice with a pause in between
    for (let repeat = 0; repeat < 2; repeat++) {
      const repeatDelay = repeat * 1.2; // 1.2s between repeats

      // Create filter for smooth, pleasant tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now + repeatDelay);
      filter.Q.setValueAtTime(0.5, now + repeatDelay);

      const masterGain = ctx.createGain();
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Two gentle ascending chimes: C5 -> G5
      const notes = [
        { freq: 523.25, harmonic: 783.99, delay: 0 },    // C5 + G5
        { freq: 783.99, harmonic: 1046.5, delay: 0.18 }  // G5 + C6
      ];

      notes.forEach(note => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(filter);

        const startTime = now + repeatDelay + note.delay;

        // Main tone
        osc1.frequency.setValueAtTime(note.freq, startTime);
        osc1.type = 'sine';

        // Harmonic for brightness
        osc2.frequency.setValueAtTime(note.harmonic, startTime);
        osc2.type = 'sine';

        // Smooth envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.6);
        osc2.stop(startTime + 0.6);
      });

      // Master volume
      masterGain.gain.setValueAtTime(1, now + repeatDelay);
      masterGain.gain.linearRampToValueAtTime(0, now + repeatDelay + 0.85);
    }
  }

  /**
   * Play completion sound (end of all sessions)
   * Celebratory ascending chimes - warm and satisfying (plays twice)
   */
  playCompleteSound() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Play twice with a pause in between
    for (let repeat = 0; repeat < 2; repeat++) {
      const repeatDelay = repeat * 1.5; // 1.5s between repeats

      // Create filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now + repeatDelay);
      filter.Q.setValueAtTime(1, now + repeatDelay);

      const masterGain = ctx.createGain();
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Three ascending chimes with harmonics: C5 -> E5 -> G5
      const notes = [
        { freq: 523.25, harmonic: 659.25 },  // C5 + E5
        { freq: 659.25, harmonic: 783.99 },  // E5 + G5
        { freq: 783.99, harmonic: 1046.5 }   // G5 + C6
      ];

      notes.forEach((note, i) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(filter);

        const startTime = now + repeatDelay + i * 0.22;

        osc1.frequency.setValueAtTime(note.freq, startTime);
        osc2.frequency.setValueAtTime(note.harmonic, startTime);

        osc1.type = 'sine';
        osc2.type = 'sine';

        // Gentle envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.5);
        osc2.stop(startTime + 0.5);
      });

      // Master volume fade
      masterGain.gain.setValueAtTime(1, now + repeatDelay);
      masterGain.gain.linearRampToValueAtTime(0, now + repeatDelay + 1.1);
    }
  }
}

// Export singleton instance
export const timerSounds = new TimerSounds();

